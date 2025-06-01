class InstagramConnection {
    static session: any = null;

    async getSession(request?: any, response?: any) {
        InstagramConnection.session = response.session;
    }

    async getProfile(request?: any, response?: any) {
        
    }
}