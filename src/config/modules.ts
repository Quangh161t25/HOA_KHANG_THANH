import type { LucideIcon } from 'lucide-react';

export interface ModuleDef {
  slug: string;
  titleKey: string;
  descKey: string;
  icon: LucideIcon;
  color: string;
}

export interface ModuleGroupDef {
  groupKey: string;
  items: ModuleDef[];
}

export interface ModuleRootDef {
  base: string;
  labelKey: string;
  groups: ModuleGroupDef[];
}

export const MODULE_ROOTS: ModuleRootDef[] = [];
