export default interface ProdutoDTO {
  id_produto: number;
  id_categoria: number;
  categoria_nome?: string | undefined;
  codigo: string;
  nome: string;
  descricao?: string | undefined;
  preco_unitario: number;
  quantidade_disponivel: number;
  quantidade_minima: number;
  valor_em_estoque?: number | undefined;
  ativo: boolean;
  data_cadastro: Date;
}