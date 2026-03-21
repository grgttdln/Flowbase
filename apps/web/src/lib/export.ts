import type Konva from 'konva';
import { useCanvasStore } from '@flowbase/canvas';

function triggerDownload(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  URL.revokeObjectURL(url);
}

export function exportFlowbase(projectName: string) {
  const { elements } = useCanvasStore.getState();
  const data = {
    version: 1,
    name: projectName,
    scene: { version: 1, elements },
    exportedAt: Date.now(),
  };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const safeName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'project';
  triggerBlobDownload(blob, `${safeName}.flowbase`);
}

export function exportPNG(projectName: string, stage: Konva.Stage) {
  const safeName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'project';
  const dataUrl = stage.toDataURL({ pixelRatio: 2 });
  triggerDownload(dataUrl, `${safeName}.png`);
}
