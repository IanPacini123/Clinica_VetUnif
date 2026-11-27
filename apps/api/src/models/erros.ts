class ErroHttp extends Error {
    readonly statusCode: number
    readonly campos?: Record<string, string> | undefined
    constructor(statusCode: number, mensagem: string, campos?: Record<string, string>) {
        super(mensagem);
        this.name = "ErroHttp";
        this.statusCode = statusCode;
        this.campos = campos;
    }
}

export { ErroHttp };
