// imports
import jwt from 'jsonwebtoken';
import { type Request, type Response, type NextFunction } from 'express';
import { DatabaseModel } from '../model/DatabaseModel.js';

// palavra secreta
const SECRET = 'SistemaInformatica@2026';
// pool de conexão ao banco de dados
const database = new DatabaseModel().pool;

/**
 * Interface para representar um Payload do JWT
 * (Não obrigatório, mas recomendado)
 */
interface JwtPayload {
    id: number;
    nome: string;
    email: string;
    role: string;
    exp: number;
}

/**
 * Gera e trata um token de autenticação para o sistema
 */
export class Auth {

    /**
     * Valida as credenciais do usuário no banco de dados
     * @param req Requisição com as informações do usuário
     * @param res Resposta enviada a quem requisitou o login
     * @returns Token de autenticação caso o usuário seja válido, mensagem de login não autorizado caso negativo
     */
    static async validacaoUsuario(req: Request, res: Response): Promise<any> {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ auth: false, token: null, message: "Informe e-mail e senha." });
        }

        try {
            const querySelectUser = `SELECT id_usuario, nome, email, senha, role FROM usuario WHERE email=$1 AND senha=$2;`;
            const queryResult = await database.query(querySelectUser, [email, senha]);

            if (queryResult.rowCount != 0) {
                const usuario = {
                    id_usuario: queryResult.rows[0].id_usuario,
                    nome: queryResult.rows[0].nome,
                    email: queryResult.rows[0].email,
                    role: queryResult.rows[0].role
                };

                const tokenUsuario = Auth.generateToken(parseInt(usuario.id_usuario), usuario.nome, usuario.email, usuario.role);
                return res.status(200).json({ auth: true, token: tokenUsuario, usuario: usuario });
            }
        } catch (error) {
            console.warn(`[Auth] Aviso ao consultar tabela usuario: ${error}. Utilizando autenticação padrão se aplicável.`);
        }

        // Usuário padrão de acesso / administrador
        if ((email === 'admin@infotech.com' || email === 'admin@admin.com') && (senha === 'admin123' || senha === 'admin')) {
            const usuario = {
                id_usuario: 1,
                nome: "Administrador InfoTech",
                email: email,
                role: "ADMIN"
            };
            const tokenUsuario = Auth.generateToken(usuario.id_usuario, usuario.nome, usuario.email, usuario.role);
            return res.status(200).json({ auth: true, token: tokenUsuario, usuario: usuario });
        }

        return res.status(401).json({ auth: false, token: null, message: "Usuário e/ou senha incorretos" });
    }

    /**
     * Gera token de validação do usuário
     * 
     * @param id ID do usuário no banco de dados
     * @param nome Nome do usuário no banco de dados
     * @param email Email do usuário no banco de dados
     * @returns Token de autenticação do usuário
     */
    static generateToken(id: number, nome: string, email: string, role: string) {
        // retora o token gerado
        // id: ID do professor no banco de dados
        // nome: nome do professor no banco de dados
        // email: email do professor no banco de dados
        // SECRET: palavra secreta
        // expiresIn: tempo até a expiração do token (neste exemplo, 1 hora)
        return jwt.sign({ id, nome, email, role }, SECRET, { expiresIn: '1h' });
    }

    /**
     * Verifica o token do usuário para saber se ele é válido
     * 
     * @param req Requisição
     * @param res Resposta
     * @param next Próximo middleware
     * @returns Token validado ou erro
     */
    static verifyToken(req: Request, res: Response, next: NextFunction) {
        const token = req.headers['x-access-token'] as string;

        if (!token) {
            console.log('Token não informado');
            return res.status(401).json({ message: "Token não informado", auth: false }).end();
        }

        jwt.verify(token, SECRET, (err, decoded) => {
            // verifica se ocorreu algum erro na validação do token
            if (err) {
                // verifica se o token já expirou
                if (err.name === 'TokenExpiredError') {
                    console.log('Token expirado');
                    return res.status(401).json({ message: "Token expirado, faça o login novamente", auth: false }).end();
                } else {
                    console.log('Token inválido.');
                    return res.status(401).json({ message: "Token inválido, faça o login", auth: false }).end();
                }
            }

            // garante que o decoded não é undefined antes de continuar
            if (!decoded) {
                console.log('Token não pôde ser decodificado');
                return res.status(401).json({ message: "Token inválido, faça o login", auth: false }).end();
            }

            // desestrutura o objeto JwtPayload e armazena as informações exp e id em variáveis
            const { exp, id } = decoded as JwtPayload;

            // verifica se existe data de expiração ou o id no token que foi recebido pelo cliente
            if (!exp || !id) {
                console.log('Data de expiração ou ID não encontrada no token');
                return res.status(401).json({ message: "Token inválido, faça o login", auth: false }).end();
            }

            // verifica se o tempo de validade do token foi expirado
            const currentTime = Math.floor(Date.now() / 1000);
            if (currentTime > exp) {
                console.log('Token expirado');
                return res.status(401).json({ message: "Token expirado, faça o login novamente", auth: false }).end();
            }

            req.headers['userId'] = String(id);
            next();
        });
    }
}