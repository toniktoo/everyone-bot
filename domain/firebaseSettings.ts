/**
 * Value object defining connection settings for Firebase.
 */
export default class FirebaseSettings {
    projectName: string
    databaseSecret: string

    /**
     * @param  {String} projectName - Firebase project name.
     * @param  {String} databaseSecret - Secret used to access the firebase realtime database.
     * @return {FirebaseSettings}
     */
    constructor(projectName: string, databaseSecret: string) {
        this.projectName = projectName;
        this.databaseSecret = databaseSecret;
    }

    /**
     * @param  {String} resource - Path in the firebase object being retrieved.
     * @param  {String} queryParams - Optional firebase query params for filtering, sorting, etc.
     * @return {String}
     */
    buildPath(resource: string): string {
        if (!resource) {
            throw new SyntaxError('No resource specified when building firebase path')
        }

        return `https://${this.projectName}-default-rtdb.europe-west1.firebasedatabase.app/${resource}?auth=${this.databaseSecret}`;
    }
}