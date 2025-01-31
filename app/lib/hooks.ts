import jotai from 'jotai';

export const editSheetAtom = jotai.atom(false);
export const isCurrentListAtom = jotai.atom<null | number>(null);
export const profileSheetAtom = jotai.atom(false);
export const scannerSheetAtom = jotai.atom(false);
export const shareSheetAtom = jotai.atom(false);