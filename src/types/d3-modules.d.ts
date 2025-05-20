declare module 'd3' {
  // Basic d3 selection methods
  export function select(selector: string | Element): Selection;
  export function selectAll(selector: string): Selection;
  
  // d3-scale
  export function scaleLinear(): any;
  export function scaleOrdinal(): any;
  export function scaleBand(): any;
  export function scaleTime(): any;
  
  // d3-shape
  export function arc(): any;
  export function pie(): any;
  export function line(): any;
  export function area(): any;
  export const curveBasis: any;
  export const curveMonotoneX: any;
  
  // d3-array
  export function extent(data: any[], accessor?: (d: any) => any): [any, any];
  export function max(data: any[], accessor?: (d: any) => any): any;
  export function min(data: any[], accessor?: (d: any) => any): any;
  export function sum(data: any[], accessor?: (d: any) => any): number;
  
  // d3-axis
  export function axisBottom(scale: any): any;
  export function axisLeft(scale: any): any;
  export function axisRight(scale: any): any;
  export function axisTop(scale: any): any;
  
  // d3-color
  export function color(color: string): RGBColor | HSLColor | null;
  export interface RGBColor {
    r: number;
    g: number;
    b: number;
    opacity: number;
    darker(k: number): RGBColor;
    brighter(k: number): RGBColor;
    toString(): string;
  }
  export interface HSLColor {
    h: number;
    s: number;
    l: number;
    opacity: number;
    darker(k: number): HSLColor;
    brighter(k: number): HSLColor;
    toString(): string;
  }
  
  // Extra types for d3 selections and data binding
  export interface Selection {
    attr(name: string, value: any): Selection;
    style(name: string, value: any): Selection;
    text(value: string): Selection;
    append(element: string): Selection;
    on(event: string, listener: any): Selection;
    call(func: any): Selection;
    data(data: any[]): Selection;
    enter(): Selection;
    exit(): Selection;
    merge(selection: Selection): Selection;
    transition(): Transition;
    remove(): Selection;
  }
  
  export interface Transition extends Selection {
    duration(ms: number): Transition;
    delay(ms: number): Transition;
    attr(name: string, value: any): Transition;
    style(name: string, value: any): Transition;
  }
  
  // PieArcDatum interface for pie charts
  export interface PieArcDatum<T> {
    data: T;
    index: number;
    value: number;
    startAngle: number;
    endAngle: number;
    padAngle: number;
  }
}