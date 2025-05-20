import * as d3 from 'd3';

declare module 'd3' {
  export interface SankeyNode extends d3.SimulationNodeDatum {
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