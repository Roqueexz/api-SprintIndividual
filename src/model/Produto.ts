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
        return {
            id_produto: produto.id_produto,
            id_categoria: produto.id_categoria,
            codigo: produto.codigo,
            nome: produto.nome,
            descricao: produto.descricao,
            preco_unitario: produto.preco_unitario,
            quantidade_disponivel: produto.quantidade_disponivel,
            quantidade_minima: produto.quantidade_minima,
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
                SELECT *
                FROM produto
                WHERE ativo = TRUE
                ORDER BY nome;
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
                SELECT *
                FROM produto
                WHERE id_produto = $1;
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