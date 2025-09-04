import { CredentialSecret } from "@/lib/credentials/schema";
import prisma from "@/lib/prisma";
import {
    CredentialCreateRequest,
    SafeCredentialResponse,
} from "@/types/credentials/credential-types";
import { JsonValue } from "@prisma/client/runtime/library";


export async function storeCredential(userId: InternalUserId, credentialData: CredentialCreateRequest): Promise<SafeCredentialResponse> {
    try {
        const newCredential = await prisma.credential.create({
            data: {
                name: credentialData.name,
                type: credentialData.type,
                provider: credentialData.provider,
                secret: JSON.stringify(credentialData.secret),
                userId: userId as string,
                config: credentialData.config as JsonValue,
            }
        });
        return {
            id: newCredential.id,
            name: newCredential.name,
            type: newCredential.type,
            provider: newCredential.provider,
            createdAt: newCredential.createdAt,
            updatedAt: newCredential.updatedAt,
            config: newCredential.config
        };
    } catch (error) {
        throw new Error("Error storing credentials", error)
    }
}

export async function updateCredential(userId: InternalUserId, credentialId: string, credentialSecret: CredentialSecret): Promise<SafeCredentialResponse> {

    try {
        const updatedCredential = await prisma.credential.update({
            where: {
                id: credentialId,
                userId: userId,
            },
            data: {
                secret: JSON.stringify(credentialSecret),
            }
        });
        return {
            id: updatedCredential.id,
            name: updatedCredential.name,
            type: updatedCredential.type,
            provider: updatedCredential.provider,
            createdAt: updatedCredential.createdAt,
            updatedAt: updatedCredential.updatedAt,
            config: updatedCredential.config
        };
    } catch (error) {
        throw new Error("Error updating credentials", error)
    }
}

export async function deleteCredential(userId: InternalUserId, credentialId: string) {
    try {
         await prisma.credential.delete({
            where: {
                userId: userId,
                id: credentialId
            }
        })
    } catch (error) {
        throw new Error("Error deleting credentials", error)
    }
}


export async function getAllUserCredentials(userId: InternalUserId): Promise<SafeCredentialResponse[]> {
    try {
        const credentials = await prisma.credential.findMany({
            where: {
                userId: userId
            },
            select: {
                id: true,
                name: true,
                type: true,
                provider: true,
                createdAt: true,
                updatedAt: true,
                config: true
            }
        });
        return credentials;
    } catch (error) {
        throw new Error("Error getting credentials", error)
    }
}

export async function getCredential(userId: InternalUserId, credentialId: string): Promise<SafeCredentialResponse | null> {
    try {
        const credential = await prisma.credential.findUnique({
            where: {
                id: credentialId,
                userId: userId,
            },
            select: {
                id: true,
                name: true,
                type: true,
                provider: true,
                createdAt: true,
                updatedAt: true,
                config: true
            }
        });
        if (!credential) {
            return null;
        }
        return credential;
    } catch (error) {
        throw new Error("Error getting credentials", error)
    }
}
