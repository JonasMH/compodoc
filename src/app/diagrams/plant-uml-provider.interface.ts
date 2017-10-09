export interface IPlantUmlProvider {
    getDiagram(file: string): Promise<Buffer>;
}