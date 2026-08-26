export default interface MovimentacaoDTO {
  id_movimentacao: number;
  id_produto: number;
  produto_codigo?: string | undefined;
  produto_nome?: string | undefined;
  id_movimentacao_origem?: number | undefined;
  tipo: 'ENTRADA' | 'SAIDA';
  motivo:
    | 'RECEBIMENTO'
    | 'VENDA'
    | 'DANIFICADO'
    | 'USO_INTERNO'
    | 'PERDA'
    | 'CORRECAO';
  quantidade: number;
  preco_unitario_praticado?: number | undefined;
  valor_total?: number | undefined;
  observacao: string;
  data_movimentacao: Date;
}