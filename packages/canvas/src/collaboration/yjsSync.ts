import * as Y from 'yjs'
import type { Element } from '@flowbase/shared'
import type { CanvasState } from '../store/useCanvasStore'
import type { StoreApi } from 'zustand'

let isRemoteUpdate = false

export function getIsRemoteUpdate(): boolean {
  return isRemoteUpdate
}

/**
 * Convert a plain Element object to a Y.Map
 */
function elementToYMap(element: Element): Y.Map<unknown> {
  const yMap = new Y.Map<unknown>()
  for (const [key, value] of Object.entries(element)) {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        yMap.set(key, JSON.stringify(value))
      } else if (typeof value === 'object' && value !== null) {
        yMap.set(key, JSON.stringify(value))
      } else {
        yMap.set(key, value)
      }
    }
  }
  return yMap
}

/**
 * Convert a Y.Map back to a plain Element object
 */
function yMapToElement(yMap: Y.Map<unknown>): Element {
  const obj: Record<string, unknown> = {}
  yMap.forEach((value, key) => {
    if (typeof value === 'string') {
      if (
        (key === 'points' || key === 'startBinding' || key === 'endBinding') &&
        (value.startsWith('[') || value.startsWith('{'))
      ) {
        try {
          obj[key] = JSON.parse(value)
        } catch {
          obj[key] = value
        }
      } else {
        obj[key] = value
      }
    } else {
      obj[key] = value
    }
  })
  return obj as Element
}

/**
 * Initialize the Yjs document from the current Zustand state (owner only).
 */
export function initYDocFromStore(
  doc: Y.Doc,
  store: StoreApi<CanvasState>,
): void {
  const elementsMap = doc.getMap('elements')
  const elements = store.getState().elements

  doc.transact(() => {
    for (const element of elements) {
      elementsMap.set(element.id, elementToYMap(element))
    }
  })
}

/**
 * Initialize the Zustand store from the Yjs document (collaborator joining).
 */
export function initStoreFromYDoc(
  doc: Y.Doc,
  store: StoreApi<CanvasState>,
): void {
  const elementsMap = doc.getMap('elements')
  const elements: Element[] = []

  elementsMap.forEach((value, _key) => {
    if (value instanceof Y.Map) {
      elements.push(yMapToElement(value))
    }
  })

  isRemoteUpdate = true
  store.getState().setElements(elements)
  isRemoteUpdate = false
}

/**
 * Start bidirectional sync between Zustand store and Yjs document.
 * Returns a cleanup function to stop syncing.
 */
export function startSync(
  doc: Y.Doc,
  store: StoreApi<CanvasState>,
): () => void {
  const elementsMap = doc.getMap('elements')

  // --- Zustand → Yjs ---
  let prevElements = store.getState().elements

  const unsubscribe = store.subscribe((state) => {
    if (isRemoteUpdate) return

    const nextElements = state.elements
    if (nextElements === prevElements) return

    const prevMap = new Map(prevElements.map((el) => [el.id, el]))
    const nextMap = new Map(nextElements.map((el) => [el.id, el]))

    doc.transact(() => {
      // Added or updated elements
      for (const [id, element] of nextMap) {
        const prev = prevMap.get(id)
        if (!prev) {
          // New element
          elementsMap.set(id, elementToYMap(element))
        } else if (prev !== element) {
          // Updated element — update individual keys
          const yMap = elementsMap.get(id)
          if (yMap instanceof Y.Map) {
            for (const [key, value] of Object.entries(element)) {
              const prevValue = (prev as Record<string, unknown>)[key]
              if (value !== prevValue) {
                if (value === undefined) {
                  yMap.delete(key)
                } else if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
                  yMap.set(key, JSON.stringify(value))
                } else {
                  yMap.set(key, value)
                }
              }
            }
            // Handle removed keys
            for (const key of Object.keys(prev)) {
              if (!(key in element) || (element as Record<string, unknown>)[key] === undefined) {
                yMap.delete(key)
              }
            }
          } else {
            elementsMap.set(id, elementToYMap(element))
          }
        }
      }

      // Deleted elements
      for (const id of prevMap.keys()) {
        if (!nextMap.has(id)) {
          elementsMap.delete(id)
        }
      }
    })

    prevElements = nextElements
  })

  // --- Yjs → Zustand ---
  const observer = () => {
    if (isRemoteUpdate) return

    const elements: Element[] = []
    elementsMap.forEach((value, _key) => {
      if (value instanceof Y.Map) {
        elements.push(yMapToElement(value))
      }
    })

    elements.sort((a, b) => a.zIndex - b.zIndex)

    isRemoteUpdate = true
    store.getState().setElements(elements)
    isRemoteUpdate = false

    prevElements = store.getState().elements
  }

  elementsMap.observeDeep(observer)

  return () => {
    unsubscribe()
    elementsMap.unobserveDeep(observer)
  }
}
