export interface Link {
  href: string;
  label: string;
  target: LinkTarget;
}

export type LinkTarget = "_blank" | "_self" | "_parent" | "_top";
