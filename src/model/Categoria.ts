import type CategoriaDTO from "../interface/CategoriaDTO.js";
import { DatabaseModel } from "./DatabaseModel.js";

const database = new DatabaseModel().pool;

class Categoria {

    // ==================== ATRIBUTOS PRIVADOS ====================

    private id_categoria: number = 0;
    private nome: string;

    // ==================== CONSTRUTOR ====================

    constructor(
        _nome: string
    ) {
        this.nome = _nome;
    }

    // ==================== GETTERS E SETTERS ====================

    public getIdCategoria(): number {
        return this.id_categoria;
    }

    public setIdCategoria(id_categoria: number): void {
        this.id_categoria = id_categoria;
    }

    public getNome(): string {
        return this.nome;
    }

    public setNome(nome: string): void {
        this.nome = nome;
    }

    // ==================== MÉTODO PRIVADO: toDTO ====================

    private static toDTO(categoria: any): CategoriaDTO {
        return {
            id_categoria: categoria.id_categoria,
            nome: categoria.nome
        };
    }

    // ==================== CREATE ====================

    static async cadastrarCategoria(
        categoria: Categoria
    ): Promise<boolean> {

        try {

            const query = `
                INSERT INTO categoria (
                    nome
                )
                VALUES ($1)
                RETURNING id_categoria;
            `;

            const valores = [
                categoria.getNome()
            ];

            const respostaBD = await database.query(
                query,
                valores
            );

            if (respostaBD.rows.length === 0) {
                throw new Error(
                    "INSERT não retornou ID — cadastro pode ter falhado."
                );
            }

            console.info(
                `[CategoriaModel] Categoria cadastrada com sucesso. ID: ${respostaBD.rows[0].id_categoria}`
            );

            return true;

        } catch (error) {

            console.error(
                `[CategoriaModel] Erro ao cadastrar categoria:`,
                error
            );

            throw error;
        }
    }

    // ==================== READ ====================

    static async listarCategorias(): Promise<CategoriaDTO[]> {

        try {

            const query = `
                SELECT *
                FROM categoria
                ORDER BY nome;
            `;

            const respostaBD = await database.query(query);

            return respostaBD.rows.map(
                Categoria.toDTO
            );

        } catch (error) {

            console.error(
                `[CategoriaModel] Erro ao listar categorias:`,
                error
            );

            throw error;
        }
    }

    static async listarCategoria(
        id_categoria: number
    ): Promise<CategoriaDTO> {

        try {

            const query = `
                SELECT *
                FROM categoria
                WHERE id_categoria = $1;
            `;

            const respostaBD = await database.query(
                query,
                [id_categoria]
            );

            if (respostaBD.rows.length === 0) {
                throw new Error(
                    `Categoria com ID ${id_categoria} não encontrada.`
                );
            }

            return Categoria.toDTO(
                respostaBD.rows[0]
            );

        } catch (error) {

            console.error(
                `[CategoriaModel] Erro ao buscar categoria (id: ${id_categoria}):`,
                error
            );

            throw error;
        }
    }

    // ==================== UPDATE ====================

    static async atualizarCategoria(
        categoria: Categoria
    ): Promise<boolean> {

        try {

            // Verifica se a categoria existe antes de atualizar
            await Categoria.listarCategoria(
                categoria.getIdCategoria()
            );

            const query = `
                UPDATE categoria
                SET nome = $1
                WHERE id_categoria = $2;
            `;

            const valores = [
                categoria.getNome(),
                categoria.getIdCategoria()
            ];

            const respostaBD = await database.query(
                query,
                valores
            );

            return (respostaBD.rowCount ?? 0) > 0;

        } catch (error) {

            console.error(
                `[CategoriaModel] Erro ao atualizar categoria (id: ${categoria.getIdCategoria()}):`,
                error
            );

            throw error;
        }
    }

    // ==================== PATCH ====================

    static async atualizarParcialCategoria(
        id_categoria: number,
        dados: Partial<CategoriaDTO>
    ): Promise<boolean> {

        try {

            // Verifica se a categoria existe
            await Categoria.listarCategoria(id_categoria);

            const campos: string[] = [];
            const valores: any[] = [];
            let index = 1;

            if (dados.nome !== undefined) {
                campos.push(`nome = $${index++}`);
                valores.push(dados.nome);
            }

            if (campos.length === 0) {
                return true;
            }

            valores.push(id_categoria);
            const query = `
                UPDATE categoria
                SET ${campos.join(', ')}
                WHERE id_categoria = $${index};
            `;

            const respostaBD = await database.query(query, valores);
            return (respostaBD.rowCount ?? 0) > 0;

        } catch (error) {

            console.error(
                `[CategoriaModel] Erro ao atualizar parcialmente categoria (id: ${id_categoria}):`,
                error
            );

            throw error;
        }
    }

    // ==================== DELETE ====================

    static async removerCategoria(
        id_categoria: number
    ): Promise<boolean> {

        try {

            // Verifica se a categoria existe
            await Categoria.listarCategoria(
                id_categoria
            );

            const query = `
                DELETE FROM categoria
                WHERE id_categoria = $1;
            `;

            const respostaBD = await database.query(
                query,
                [id_categoria]
            );

            return (respostaBD.rowCount ?? 0) > 0;

        } catch (error) {

            console.error(
                `[CategoriaModel] Erro ao remover categoria (id: ${id_categoria}):`,
                error
            );

            throw error;
        }
    }
}

export default Categoria;