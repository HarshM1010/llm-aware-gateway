import dotenv from 'dotenv';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';

dotenv.config();

const hfEmbeddings = new HuggingFaceInferenceEmbeddings({
    apiKey: process.env.HUGGINGFACE_API_KEY as string,
    model: 'BAAI/bge-small-en-v1.5',
});

export const getEmbedding = async (prompt: string): Promise<number[]> => {
    const isProd = process.env.NODE_ENV === 'production';

    if (isProd) {
        try {
            return await hfEmbeddings.embedQuery(prompt);
        } catch (error) {
            console.error('Cloud Embedding SDK Error:', error);
            throw error;
        }
    } else {
        // console.log('Generating embedding via Local Python Worker...');
        
        const response = await fetch('http://localhost:8000/embed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: prompt })
        });

        if (!response.ok) {
            throw new Error('Local Embedding Generation Failed');
        }

        const data = await response.json();
        return data.embedding;
    }
};