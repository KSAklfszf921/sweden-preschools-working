import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMapStore } from '@/stores/mapStore';
import { toast } from 'sonner';

export const useRealTimeUpdates = () => {
  const { preschools, setPreschools, updatePreschool } = useMapStore();

  const handleInsert = useCallback((payload: any) => {
    const newPreschool = {
      id: payload.new.id,
      namn: payload.new.Namn,
      kommun: payload.new.Kommun,
      adress: payload.new.Adress || '',
      latitud: payload.new.Latitud || 0,
      longitud: payload.new.Longitud || 0,
      antal_barn: payload.new["Antal barn"],
      huvudman: payload.new.Huvudman,
      personaltäthet: payload.new.Personaltäthet,
      andel_med_förskollärarexamen: payload.new["Andel med förskollärarexamen"],
      antal_barngrupper: payload.new["Antal barngrupper"],
    };

    setPreschools([...preschools, newPreschool]);
    toast.success(`Ny förskola tillagd: ${newPreschool.namn}`);
  }, [preschools, setPreschools]);

  const handleUpdate = useCallback((payload: any) => {
    const updatedPreschool = {
      id: payload.new.id,
      namn: payload.new.Namn,
      kommun: payload.new.Kommun,
      adress: payload.new.Adress || '',
      latitud: payload.new.Latitud || 0,
      longitud: payload.new.Longitud || 0,
      antal_barn: payload.new["Antal barn"],
      huvudman: payload.new.Huvudman,
      personaltäthet: payload.new.Personaltäthet,
      andel_med_förskollärarexamen: payload.new["Andel med förskollärarexamen"],
      antal_barngrupper: payload.new["Antal barngrupper"],
    };

    updatePreschool(updatedPreschool);
    toast.info(`Förskola uppdaterad: ${updatedPreschool.namn}`);
  }, [updatePreschool]);

  const handleDelete = useCallback((payload: any) => {
    const deletedId = payload.old.id;
    const remainingPreschools = preschools.filter(p => p.id !== deletedId);
    setPreschools(remainingPreschools);
    toast.error(`Förskola borttagen: ${payload.old.Namn}`);
  }, [preschools, setPreschools]);

  useEffect(() => {
    // Subscribe to preschool changes
    const preschoolSubscription = supabase
      .channel('preschool_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'Förskolor' }, 
        handleInsert
      )
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'Förskolor' }, 
        handleUpdate
      )
      .on('postgres_changes', 
        { event: 'DELETE', schema: 'public', table: 'Förskolor' }, 
        handleDelete
      )
      .subscribe();

    // Subscribe to Google data changes
    const googleDataSubscription = supabase
      .channel('google_data_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'preschool_google_data' },
        (payload) => {
          toast.info('Google-data uppdaterad');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(preschoolSubscription);
      supabase.removeChannel(googleDataSubscription);
    };
  }, [handleInsert, handleUpdate, handleDelete]);

  return {
    // Connection status could be exposed here if needed
  };
};