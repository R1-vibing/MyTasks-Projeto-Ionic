/**
 * Modelo para Tarefa
 */
export interface Tarefa {
  id: number;
  titulo: string;
  descricao: string;
  dataLimite: string; // ISO string format
  imagem?: string; // Base64 ou URL
  projetoId: number;
}

