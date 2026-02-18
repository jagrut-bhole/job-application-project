import axios from "axios";
import { registerSchema, RegisterSchemaResponse } from "@/types/authTypes";
import { z } from "zod";

export const registerReq = async (data : z.infer<typeof registerSchema>) : Promise<RegisterSchemaResponse> => {
    try {
        const response = await axios.post('/api/auth/register', data);
        return response.data;
    } catch (error) {
        console.log("Error in register request: ",error);
        throw error;
    }
}