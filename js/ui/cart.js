/**
 * Cart lives only in the browser until checkout (CONTEXT.md §8).
 * One cart can mix multiple vendors; checkout splits into order_items per vendor.
 */
import { showToast } from '../core/utils.js'

const CART_KEY = 'soko_cart'

export function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart))
  updateCartBadge()
}

/**
 * Add a line item. commissionRate is copied from the vendor row at click time.
 */
export function addToCart(product, vendorId, vendorName, commissionRate = 10) {
  const cart = getCart()
  const existing = cart.find((i) => i.productId === product.id)
  if (existing) {
    existing.quantity += 1
  } else {
    cart.push({
      productId: product.id,
      vendorId,
      vendorName,
      title: product.title,
      image: product.images?.[0]?.url || null,
      price: product.price,
      commissionRate,
      quantity: 1,
    })
  }
  saveCart(cart)
  showToast(`${product.title} added to cart`)
}

export function removeFromCart(productId) {
  const cart = getCart().filter((i) => i.productId !== productId)
  saveCart(cart)
}

export function setQuantity(productId, quantity) {
  const q = Math.max(1, parseInt(String(quantity), 10) || 1)
  const cart = getCart().map((i) =>
    i.productId === productId ? { ...i, quantity: q } : i
  )
  saveCart(cart)
}

export function clearCart() {
  localStorage.removeItem(CART_KEY)
  updateCartBadge()
}

export function getCartSubtotal() {
  return getCart().reduce((sum, i) => sum + i.price * i.quantity, 0)
}

export function updateCartBadge() {
  const count = getCart().reduce((sum, i) => sum + i.quantity, 0)
  document.querySelectorAll('[data-cart-count]').forEach((el) => {
    el.textContent = count > 0 ? String(count) : ''
    el.style.display = count > 0 ? 'inline-flex' : 'none'
  })
}
