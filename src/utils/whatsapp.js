/**
 * PET POOJA — WhatsApp Utilities
 * Uses wa.me deep links for free, no-API WhatsApp messaging.
 */
import { CONFIG } from '../config.js';
import { formatPrice } from './format.js';

/**
 * Open WhatsApp chat with prefilled message
 */
export function openWhatsApp(number, message) {
  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/${number}?text=${encoded}`;
  window.open(url, '_blank');
}

/**
 * Send order text to owner via WhatsApp
 */
export function sendOrderToWhatsApp(order) {
  const lines = [
    `🍕 *NEW ORDER — ${CONFIG.shop.fullName}*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📋 Order: *#${order.orderNum}*`,
    `👤 Customer: *${order.customer.name}*`,
    `📱 Mobile: ${order.customer.mobile}`,
    `📍 Mode: ${order.mode.toUpperCase()}`,
    `🕐 Time: ${new Date(order.createdAt).toLocaleString('en-IN')}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `*ITEMS:*`,
  ];

  order.items.forEach((item, i) => {
    lines.push(`${i + 1}. ${item.name} × ${item.qty} = ${formatPrice(item.price * item.qty)}`);
  });

  if (order.extras && order.extras.length > 0) {
    lines.push(``, `*EXTRAS:*`);
    order.extras.forEach(ex => {
      lines.push(`  + ${ex.name} = ${formatPrice(ex.price)}`);
    });
  }

  lines.push(
    ``,
    `━━━━━━━━━━━━━━━━━━━━`,
    `Subtotal: ${formatPrice(order.subtotal)}`,
  );

  if (order.extrasTotal > 0) {
    lines.push(`Extras: +${formatPrice(order.extrasTotal)}`);
  }
  if (order.discount > 0) {
    lines.push(`Discount: -${formatPrice(order.discount)}`);
  }

  lines.push(
    `*TOTAL: ${formatPrice(order.total)}*`,
    `━━━━━━━━━━━━━━━━━━━━`,
  );

  if (order.notes) {
    lines.push(`📝 Note: ${order.notes}`);
  }
  if (order.cutlery) {
    lines.push(`🍴 Cutlery: Yes`);
  }

  lines.push(``, `— Sent via Pet Pooja App`);

  openWhatsApp(CONFIG.contacts.whatsapp, lines.join('\n'));
}

/**
 * Send fulfilled order receipt to customer
 */
export function sendReceiptToCustomer(order) {
  const lines = [
    `✅ *Order Completed — ${CONFIG.shop.fullName}*`,
    ``,
    `Hi ${order.customer.name}! Your order #${order.orderNum} is ready.`,
    ``,
    `*Items:*`,
  ];

  order.items.forEach((item, i) => {
    lines.push(`${i + 1}. ${item.name} × ${item.qty}`);
  });

  lines.push(
    ``,
    `*Total: ${formatPrice(order.total)}*`,
    ``,
    `Thank you for ordering! 🙏`,
    `— ${CONFIG.shop.fullName}`,
  );

  if (order.customer.mobile === 'Admin') {
    alert('Cannot send WhatsApp receipt to an Admin test order.');
    return;
  }
  const customerNumber = `91${order.customer.mobile}`;
  openWhatsApp(customerNumber, lines.join('\n'));
}

/**
 * Generate WhatsApp contact link for owner
 */
export function getOwnerWhatsAppLink(message = '') {
  const defaultMsg = message || `Hi! I want to order from ${CONFIG.shop.fullName}`;
  return `https://wa.me/${CONFIG.contacts.whatsapp}?text=${encodeURIComponent(defaultMsg)}`;
}

/**
 * Open phone dialer
 */
export function callOwner(index = 0) {
  const owner = CONFIG.contacts.owners[index];
  if (owner) {
    window.open(`tel:${owner.phone}`, '_self');
  }
}

/**
 * Open Google Maps directions
 */
export function openDirections() {
  window.open(CONFIG.contacts.mapUrl, '_blank');
}
