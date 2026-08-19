export interface MovimentacaoDTO {
  id_movimentacao: number;
  id_produto: number;
  id_movimentacao_origem?: number;
  tipo: 'ENTRADA' | 'SAIDA';
  motivo:
    | 'RECEBIMENTO'
    | 'VENDA'
    | 'DANIFICADO'
    | 'USO_INTERNO'
    | 'CORRECAO';
  quantidade: number;
  preco_unitario_praticado?: number;
  valor_total?: number;
  observacao: string;
  data_movimentacao: Date;
}