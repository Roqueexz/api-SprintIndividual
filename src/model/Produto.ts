import type ProdutoDTO from "../interface/ProdutoDTO.js";
import { DatabaseModel } from "./DatabaseModel.js";

const database = new DatabaseModel().pool;

class Produto {

    private id_produto: number = 0;
    private id_categoria: number;
    private codigo: string;
    private nome: string;
    private descricao: string;
    private preco_unitario: number;
    private quantidade_disponivel: number = 0;
    private quantidade_minima: number;
    private ativo: boolean = true;
    private data_cadastro: Date;

    constructor(
        _id_categoria: number,
        _codigo: string,
        _nome: string,
        _descricao: string,
        _preco_unitario: number,
        _quantidade_minima: number
    ) {
        this.id_categoria = _id_categoria;
        this.codigo = _codigo;
        this.nome = _nome;
        this.descricao = _descricao;
        this.preco_unitario = _preco_unitario;
        this.quantidade_minima = _quantidade_minima;
        this.data_cadastro = new Date();
    }

    // ==================== GETTERS E SETTERS ====================

    public getIdProduto(): number { return this.id_produto; }
    public setIdProduto(id_produto: number): void { this.id_produto = id_produto; }

    public getIdCategoria(): number { return this.id_categoria; }
    public setIdCategoria(id_categoria: number): void { this.id_categoria = id_categoria; }

    public getCodigo(): string { return this.codigo; }
    public setCodigo(codigo: string): void { this.codigo = codigo; }

    public getNome(): string { return this.nome; }
    public setNome(nome: string): void { this.nome = nome; }

    public getDescricao(): string { return this.descricao; }
    public setDescricao(descricao: string): void { this.descricao = descricao; }

    public getPrecoUnitario(): number { return this.preco_unitario; }
    public setPrecoUnitario(preco_unitario: number): void {
        this.preco_unitario = preco_unitario;
    }

    public getQuantidadeDisponivel(): number {
        return this.quantidade_disponivel;
    }

    public setQuantidadeDisponivel(quantidade_disponivel: number): void {
        this.quantidade_disponivel = quantidade_disponivel;
    }

    public getQuantidadeMinima(): number {
        return this.quantidade_minima;
    }

    public setQuantidadeMinima(quantidade_minima: number): void {
        this.quantidade_minima = quantidade_minima;
    }

    public getAtivo(): boolean { return this.ativo; }
    public setAtivo(ativo: boolean): void { this.ativo = ativo; }

    public getDataCadastro(): Date { return this.data_cadastro; }
    public setDataCadastro(data_cadastro: Date): void {
        this.data_cadastro = data_cadastro;
    }

    // ==================== MÉTODO PRIVADO: toDTO ====================

    private static toDTO(produto: any): ProdutoDTO {
        const preco = typeof produto.preco_unitario === 'string' ? parseFloat(produto.preco_unitario) : Number(produto.preco_unitario || 0);
        const qtd = Number(produto.quantidade_disponivel || 0);
        const valorEstoque = produto.valor_em_estoque !== undefined
            ? (typeof produto.valor_em_estoque === 'string' ? parseFloat(produto.valor_em_estoque) : Number(produto.valor_em_estoque))
            : (preco * qtd);

        return {
            id_produto: produto.id_produto,
            id_categoria: produto.id_categoria,
            categoria_nome: produto.categoria_nome,
            codigo: produto.codigo,
            nome: produto.nome,
            descricao: produto.descricao,
            preco_unitario: preco,
            quantidade_disponivel: qtd,
            quantidade_minima: Number(produto.quantidade_minima || 0),
            valor_em_estoque: valorEstoque,
            ativo: produto.ativo,
            data_cadastro: produto.data_cadastro
        };
    }

    // ==================== CREATE ====================

    static async cadastrarProduto(produto: Produto): Promise<boolean> {
        try {
            const query = `
                INSERT INTO produto (
                    id_categoria,
                    codigo,
                    nome,
                    descricao,
                    preco_unitario,
                    quantidade_minima
                )
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id_produto;
            `;

            const valores = [
                produto.getIdCategoria(),
                produto.getCodigo().toUpperCase(),
                produto.getNome().toUpperCase(),
                produto.getDescricao(),
                produto.getPrecoUnitario(),
                produto.getQuantidadeMinima()
            ];

            const respostaBD = await database.query(query, valores);

            if (respostaBD.rows.length === 0) {
                throw new Error(
                    "INSERT não retornou ID — cadastro pode ter falhado."
                );
            }

            console.info(
                `[ProdutoModel] Produto cadastrado com sucesso. ID: ${respostaBD.rows[0].id_produto}`
            );

            return true;

        } catch (error) {
            console.error(
                `[ProdutoModel] Erro ao cadastrar produto:`,
                error
            );
            throw error;
        }
    }

    // ==================== READ ====================

    static async listarProdutos(): Promise<ProdutoDTO[]> {
        try {
            const query = `
                SELECT 
                    p.*,
                    c.nome AS categoria_nome,
                    (p.quantidade_disponivel * p.preco_unitario) AS valor_em_estoque
                FROM produto p
                LEFT JOIN categoria c ON c.id_categoria = p.id_categoria
                WHERE p.ativo = TRUE
                ORDER BY p.nome;
            `;

            const respostaBD = await database.query(query);

            return respostaBD.rows.map(Produto.toDTO);

        } catch (error) {
            console.error(
                `[ProdutoModel] Erro ao listar produtos:`,
                error
            );
            throw error;
        }
    }

    static async listarProduto(id_produto: number): Promise<ProdutoDTO> {
        try {
            const query = `
                SELECT 
                    p.*,
                    c.nome AS categoria_nome,
                    (p.quantidade_disponivel * p.preco_unitario) AS valor_em_estoque
                FROM produto p
                LEFT JOIN categoria c ON c.id_categoria = p.id_categoria
                WHERE p.id_produto = $1;
            `;

            const respostaBD = await database.query(query, [id_produto]);

            if (respostaBD.rows.length === 0) {
                throw new Error(
                    `Produto com ID ${id_produto} não encontrado.`
                );
            }

            return Produto.toDTO(respostaBD.rows[0]);

        } catch (error) {
            console.error(
                `[ProdutoModel] Erro ao buscar produto (id: ${id_produto}):`,
                error
            );
            throw error;
        }
    }

    static async listarProdutosReposicao(): Promise<ProdutoDTO[]> {
        try {
            const query = `
                SELECT 
                    p.*,
                    c.nome AS categoria_nome,
                    (p.quantidade_disponivel * p.preco_unitario) AS valor_em_estoque
                FROM produto p
                LEFT JOIN categoria c ON c.id_categoria = p.id_categoria
                WHERE p.ativo = TRUE
                    AND p.quantidade_disponivel <= p.quantidade_minima
                ORDER BY p.nome;
            `;

            const respostaBD = await database.query(query);

            return respostaBD.rows.map(Produto.toDTO);

        } catch (error) {
            console.error(
                `[ProdutoModel] Erro ao listar produtos para reposição:`,
                error
            );
            throw error;
        }
    }

    static async obterMetricasDashboard(): Promise<any> {
        try {
            const query = `
                SELECT 
                    (SELECT COUNT(*)::int FROM produto WHERE ativo = TRUE) AS total_produtos,
                    (SELECT COALESCE(SUM(quantidade_disponivel * preco_unitario), 0)::numeric(12,2) FROM produto WHERE ativo = TRUE) AS valor_total_estoque,
                    (SELECT COUNT(*)::int FROM produto WHERE ativo = TRUE AND quantidade_disponivel <= quantidade_minima) AS produtos_reposicao,
                    (SELECT COUNT(*)::int FROM movimentacao) AS total_movimentacoes,
                    (SELECT COUNT(*)::int FROM categoria) AS total_categorias;
            `;

            const respostaBD = await database.query(query);
            const row = respostaBD.rows[0] || {};

            return {
                total_produtos: Number(row.total_produtos || 0),
                valor_total_estoque: parseFloat(row.valor_total_estoque || 0),
                produtos_reposicao: Number(row.produtos_reposicao || 0),
                total_movimentacoes: Number(row.total_movimentacoes || 0),
                total_categorias: Number(row.total_categorias || 0)
            };

        } catch (error) {
            console.error(
                `[ProdutoModel] Erro ao obter métricas do dashboard:`,
                error
            );
            throw error;
        }
    }

    // ==================== UPDATE ====================

    static async atualizarProduto(produto: Produto): Promise<boolean> {
        try {
            const produtoConsulta = await Produto.listarProduto(
                produto.getIdProduto()
            );

            if (!produtoConsulta.ativo) {
                return false;
            }

            const query = `
                UPDATE produto SET
                    id_categoria = $1,
                    codigo = $2,
                    nome = $3,
                    descricao = $4,
                    preco_unitario = $5,
                    quantidade_minima = $6
                WHERE id_produto = $7
                    AND ativo = TRUE;
            `;

            const valores = [
                produto.getIdCategoria(),
                produto.getCodigo().toUpperCase(),
                produto.getNome().toUpperCase(),
                produto.getDescricao(),
                produto.getPrecoUnitario(),
                produto.getQuantidadeMinima(),
                produto.getIdProduto()
            ];

            const respostaBD = await database.query(query, valores);

            return (respostaBD.rowCount ?? 0) > 0;

        } catch (error) {
            console.error(
                `[ProdutoModel] Erro ao atualizar produto (id: ${produto.getIdProduto()}):`,
                error
            );
            throw error;
        }
    }

    // ==================== DELETE LÓGICO ====================

    static async removerProduto(id_produto: number): Promise<boolean> {
        try {
            const produtoConsulta = await Produto.listarProduto(id_produto);

            if (!produtoConsulta.ativo) {
                return false;
            }

            const query = `
                UPDATE produto
                SET ativo = FALSE
                WHERE id_produto = $1;
            `;

            const respostaBD = await database.query(
                query,
                [id_produto]
            );

            return (respostaBD.rowCount ?? 0) > 0;

        } catch (error) {
            console.error(
                `[ProdutoModel] Erro ao remover produto (id: ${id_produto}):`,
                error
            );
            throw error;
        }
    }
}

export default Produto;