export interface BuilderSection {
  id: number;
  sectionSlug: string;
  position: number;
  name: string;
  category: string;
  description?: string;
}

export interface BuilderState {
  projectSlug: string;
  sections: BuilderSection[];
  isDragging: boolean;
  draggedId: number | null;
}

export interface ReorderPayload {
  projectSlug: string;
  sectionIds: number[];
}
