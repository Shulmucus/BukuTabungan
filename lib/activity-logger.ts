import { SupabaseClient } from '@supabase/supabase-js';
import { ActivityAction, EntityType } from './types';

interface LogActivityParams {
    supabase: SupabaseClient;
    userId: string;
    action: ActivityAction;
    entityType: EntityType;
    entityId?: string | null;
    details?: Record<string, unknown> | null;
    ipAddress?: string | null;
    userAgent?: string | null;
}

export async function logActivity({
    supabase,
    userId,
    action,
    entityType,
    entityId = null,
    details = null,
    ipAddress = null,
    userAgent = null,
}: LogActivityParams) {
    try {
        await supabase.from('activity_logs').insert({
            user_id: userId,
            action,
            entity_type: entityType,
            entity_id: entityId,
            details,
            ip_address: ipAddress,
            user_agent: userAgent,
        });
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
}
