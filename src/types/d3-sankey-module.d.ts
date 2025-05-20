declare module 'd3-sankey' {
  export interface SankeyGraph<N, L> {
    nodes: N[];
    links: L[];
  }
  export interface SankeyNode {
    name: string;
    category?: string;
    value?: number;
    x0?: number;
    x1?: number;
    y0?: number;
    y1?: number;
    index?: number;
    targetLinks?: SankeyLink[];
    sourceLinks?: SankeyLink[];
    highlight?: boolean;
    color?: string;
  }

  export interface SankeyLink {
    source: number | SankeyNode;
    target: number | SankeyNode;
    value: number;
    path?: string;
    color?: string;
    opacity?: number;
    y0?: number;
    y1?: number;
    width?: number;
    highlight?: boolean;
  }

  export interface SankeyLayout {
    nodeWidth(): number;
    nodeWidth(width: number): this;
    nodePadding(): number;
    nodePadding(padding: number): this;
    extent(): [[number, number], [number, number]];
    extent(extent: [[number, number], [number, number]]): this;
    iterations(): number;
    iterations(iterations: number): this;
    nodeId(): (node: SankeyNode) => string;
    nodeId(id: (node: SankeyNode) => string): this;
    nodeAlign(): (node: SankeyNode) => number;
    nodeAlign(align: (node: SankeyNode) => number): this;
    (data: { nodes: SankeyNode[], links: SankeyLink[] }): { nodes: SankeyNode[], links: SankeyLink[] };
  }

  // Alignment methods
  export function sankeyLeft(node: SankeyNode): number;
  export function sankeyRight(node: SankeyNode): number;
  export function sankeyCenter(node: SankeyNode): number;
  export function sankeyJustify(node: SankeyNode): number;

  // Link path generator
  export function sankeyLinkHorizontal(): (link: SankeyLink) => string;

  // Main sankey generator
  export function sankey(): SankeyLayout;
}

// Extend d3 to include sankey functions
declare module 'd3' {
  export * from 'd3-sankey';
  
  // Add explicit definitions for sankey functions
  export function sankey<N = any, L = any>(): import('d3-sankey').SankeyLayout;
  export function sankeyLinkHorizontal(): (link: any) => string;
  export function sankeyLeft(node: any): number;
  export function sankeyRight(node: any): number;
  export function sankeyCenter(node: any): number;
  export function sankeyJustify(node: any): number;
  
  // Additional helpers
  export namespace sankey {
    export const sankeyLeft: typeof d3.sankeyLeft;
    export const sankeyRight: typeof d3.sankeyRight;
    export const sankeyCenter: typeof d3.sankeyCenter;
    export const sankeyJustify: typeof d3.sankeyJustify;
  }
}