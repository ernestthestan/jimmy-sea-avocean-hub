/**
 * Translation helpers for Jimmy, Sea & Avocean International Fan Hub
 */

// Common Thai BL / fandom & catering term glossary for smart translations
const FANDOM_TERMS: Record<string, string> = {
  // Fan & Community terms
  'บ้านแฟนคลับ': 'fan club',
  'แฟนคลับ': 'fan club',
  'อโวเชี่ยน': 'Avocean',
  'ชาวทะเล': 'ChaoTalay (Sea Fans)',
  'ทินี่': 'Tiny (Jimmy Fans)',
  'นมนม': 'NomNom (JimmySea Fans)',
  'ตารางงาน': 'Schedule',
  'ซัพพอร์ต': 'Support / Catering',
  'โปรเจกต์': 'Project',
  'ฟู้ดทรัค': 'Food truck',
  'รถกาแฟ': 'Coffee cart',
  'กำลังใจ': 'Cheering & love',
  'ของขวัญ': 'Gifts',
  'สแตนด์ดอกไม้': 'Flower stand',
  'กล่องของว่าง': 'Snack boxes',
  'เค้ก': 'Custom cake',

  // Food Support & Catering Menu terms
  'ข้าวเหนียวมะม่วง': 'Mango sticky rice',
  'สมูทตี้อโวคาโด': 'Avocado smoothie',
  'ชาเขียวมัทฉะ': 'Iced matcha latte',
  'กาแฟ': 'Coffee / Americano',
  'พุดดิ้งมะพร้าว': 'Chilled coconut pudding',
  'เครื่องดื่มเกลือแร่': 'Electrolyte & energy drinks',
  'ขนมปังอบสด': 'Freshly baked pastries',
  'น้ำผลไม้ออร์แกนิก': 'Organic fruit juices',
  'คัพสลีฟ': 'Custom cup sleeves',
  'สติ๊กเกอร์': 'Special fan stickers',

  // Delivery & Gratitude terms
  'ส่งมอบเรียบร้อย': 'Successfully delivered',
  'ขอบคุณ': 'Thank you',
  'ขอบคุณแฟนคลับทุกคน': 'Thank you so much to all fans and donors',
  'ศิลปินและทีมงานชอบมาก': 'The artists and production crew loved everything',
  'ได้รับเรียบร้อยแล้ว': 'Has been received safely',
  'พร้อมการ์ดอวยพร': 'With personalized thank you and greeting cards'
};

/**
 * Returns translated text for a fan club bio.
 */
export function getTranslatedBio(
  original: string,
  preTranslated?: string
): { text: string; languageDetected: string } {
  if (preTranslated && preTranslated.trim().length > 0) {
    return {
      text: preTranslated,
      languageDetected: 'English Translation'
    };
  }

  // Detect script
  const isThai = /[\u0E00-\u0E7F]/.test(original);
  const isChinese = /[\u4E00-\u9FFF]/.test(original);
  const isJapanese = /[\u3040-\u30FF]/.test(original);
  const isVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(original);
  const isSpanish = /[áéíóúñ¿¡]/i.test(original);

  let lang = 'English';
  if (isThai) lang = 'Thai';
  else if (isChinese) lang = 'Chinese';
  else if (isJapanese) lang = 'Japanese';
  else if (isVietnamese) lang = 'Vietnamese';
  else if (isSpanish) lang = 'Spanish';

  if (lang === 'English') {
    return {
      text: original,
      languageDetected: 'English'
    };
  }

  // Provide a clean English translation using glossary
  let translated = original;
  Object.entries(FANDOM_TERMS).forEach(([thai, eng]) => {
    translated = translated.split(thai).join(` ${eng} `);
  });

  return {
    text: `[English translation]: ${translated.replace(/\s+/g, ' ').trim()}`,
    languageDetected: lang
  };
}

/**
 * Returns translated text and detected language for food support menu concept or delivery notes.
 */
export function getTranslatedSupportText(
  original: string,
  preTranslated?: string,
  type: 'concept' | 'notes' = 'concept'
): { text: string; languageDetected: string; isPreTranslated: boolean } {
  if (preTranslated && preTranslated.trim().length > 0) {
    return {
      text: preTranslated,
      languageDetected: 'English (Translator Verified)',
      isPreTranslated: true
    };
  }

  if (!original || !original.trim()) {
    return {
      text: '',
      languageDetected: 'None',
      isPreTranslated: false
    };
  }

  // Detect script
  const isThai = /[\u0E00-\u0E7F]/.test(original);
  const isChinese = /[\u4E00-\u9FFF]/.test(original);
  const isJapanese = /[\u3040-\u30FF]/.test(original);
  const isVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(original);

  let lang = 'English';
  if (isThai) lang = 'Thai';
  else if (isChinese) lang = 'Chinese';
  else if (isJapanese) lang = 'Japanese';
  else if (isVietnamese) lang = 'Vietnamese';

  if (lang === 'English') {
    return {
      text: original,
      languageDetected: 'English',
      isPreTranslated: false
    };
  }

  // Auto translate using dictionary replacement
  let translated = original;
  Object.entries(FANDOM_TERMS).forEach(([thai, eng]) => {
    translated = translated.split(thai).join(` ${eng} `);
  });

  const label = type === 'concept' ? 'Menu & Concept' : 'Delivery & Gratitude';

  return {
    text: `[${label} English Translation]: ${translated.replace(/\s+/g, ' ').trim()}`,
    languageDetected: `${lang} → English`,
    isPreTranslated: false
  };
}

/**
 * Helper to auto-generate a starter translation draft when user clicks 'Auto-Translate' in modal.
 */
export function autoTranslateFoodSupportDraft(original: string): string {
  if (!original || !original.trim()) return '';

  let translated = original;
  Object.entries(FANDOM_TERMS).forEach(([thai, eng]) => {
    translated = translated.split(thai).join(` ${eng} `);
  });

  return translated.replace(/\s+/g, ' ').trim();
}
