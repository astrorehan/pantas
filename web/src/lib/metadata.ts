/**
 * Judul dokumen per route (F-83).
 *
 * Root layout memasang `title.template` ini supaya tiap route cukup menulis
 * judulnya sendiri. Next.js hanya mewariskan template ke segmen di bawah layout
 * yang mendefinisikannya: begitu sebuah layout perantara memasang `title`
 * berupa string biasa, template dari induk berhenti di situ dan anak-anaknya
 * kehilangan sufiks. Karena itu layout perantara yang punya judul sendiri harus
 * memakai bentuk objek `{ default, template: TITLE_TEMPLATE }`.
 */
export const TITLE_TEMPLATE = "%s · PANTAS";
