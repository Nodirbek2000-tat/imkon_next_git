/**
 * Botga o'tish havolalari.
 *
 * To'lov saytda emas, botda bo'ladi: xaridor kartaga o'tkazadi va chek
 * rasmini yuboradi. Sayt faqat to'g'ri buyurtma bilan botni ochib beradi.
 */

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

/** Bot sozlanganmi? Sozlanmagan bo'lsa "To'lov qilish" tugmasi ko'rsatilmaydi. */
export const hasBot = Boolean(BOT_USERNAME);

/**
 * `t.me/imkon_bot?start=order_IM-A1B2C3D4`
 *
 * Bot `start` parametridan buyurtma raqamini oladi va darrov o'shani
 * ochadi — foydalanuvchi ro'yxatdan bo'lsa ham, hali o'tmagan bo'lsa
 * raqam so'ralgandan keyin.
 */
export function botPaymentLink(orderNumber: string) {
  return `https://t.me/${BOT_USERNAME}?start=order_${orderNumber}`;
}

export function botLink() {
  return `https://t.me/${BOT_USERNAME}`;
}
