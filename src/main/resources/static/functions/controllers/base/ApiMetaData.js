import GlobalVariables from "../../global/GlobalVariables.js";
class ApiMetaData{
    static postOptions(data){
        return{
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': GlobalVariables.token,
                'Content-Type': 'application/json'
            },
            body:data
        }
    }
    static getOptions(){
        return{
            method: 'GET',
            headers: {
                'X-CSRF-TOKEN': GlobalVariables.token,
                'Content-Type': 'application/json'
            }
        }
    }
    static patchOptions(data){
        return{
            method: 'PATCH',
            headers: {
                'X-CSRF-TOKEN': GlobalVariables.token,
                'Content-Type': 'application/json'
            },
            body:data
        }
    }
    static putOptions(data){
        if(data)return{
            method: 'PUT',
            headers: {
                'X-CSRF-TOKEN': GlobalVariables.token,
                'Content-Type': 'application/json'
            },
            body:data
        }
        else return{
            method: 'PUT',
            headers: {
                'X-CSRF-TOKEN': GlobalVariables.token,
                'Content-Type': 'application/json'
            }
        }
    }
}
export default ApiMetaData;