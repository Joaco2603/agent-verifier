function allowDiscount({ price, percent }) {
  if (percent > 30) return { allowed: false };
  return { allowed: true, price: price * (1 - percent / 100) };
}

function transfer({ balance, amount }) {
  if (amount > balance) return { accepted: false, balance };
  return { accepted: true, balance: balance - amount };
}

function roundHalfUp({ value }) {
  return { value: Math.floor(value + 0.5) };
}

function retry({ attempt }) {
  return { proceed: attempt <= 3 };
}

function filterRows({ rows, field, value }) {
  return { rows: rows.filter((row) => row[field] === value) };
}

function userOrders({ userId, orders }) {
  return { orders: orders.filter((order) => order.userId === userId) };
}

function charge({ amount }) {
  return { charge: Math.max(1, amount * 0.02) };
}

function businessDays({ start, end }) {
  const from = Date.parse(`${start}T00:00:00Z`);
  const to = Date.parse(`${end}T00:00:00Z`);
  let days = 0;
  for (let t = from; t <= to; t += 86_400_000) {
    const day = new Date(t).getUTCDay();
    if (day !== 0 && day !== 6) days += 1;
  }
  return { days };
}

function password({ password }) {
  return { valid: password.length >= 8 };
}

function sell({ stock, quantity }) {
  if (quantity > stock) return { accepted: false, stock };
  return { accepted: true, stock: stock - quantity };
}

function coupon({ price, coupons }) {
  const match = coupons.find((item) => item.match);
  if (!match) return { price, code: null };
  return { price: price - match.off, code: match.code };
}

function refund({ dailyRate, totalDays, usedDays }) {
  return { refund: dailyRate * (totalDays - usedDays) };
}

function byName({ rows }) {
  const sorted = rows.slice().sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  return { rows: sorted };
}

function email({ emails, email }) {
  if (emails.includes(email)) return { accepted: false };
  return { accepted: true, emails: emails.concat(email) };
}

function timeout({ timedOut, value, fallback }) {
  return { value: timedOut ? fallback : value };
}

function totalWithTax({ subtotal, tax }) {
  return { total: subtotal + tax };
}

function childFare({ age, price }) {
  return { price: age < 12 ? price / 2 : price };
}

function leader({ leader, challenger, leaderScore, challengerScore }) {
  if (challengerScore > leaderScore) return { leader: challenger };
  return { leader };
}

function quantity({ quantity }) {
  if (quantity < 0) return { accepted: false };
  return { accepted: true, quantity };
}

function dailyLimit({ spent, limit }) {
  return { allowed: spent <= limit };
}

export const fns = [
  allowDiscount,
  transfer,
  roundHalfUp,
  retry,
  filterRows,
  userOrders,
  charge,
  businessDays,
  password,
  sell,
  coupon,
  refund,
  byName,
  email,
  timeout,
  totalWithTax,
  childFare,
  leader,
  quantity,
  dailyLimit,
];
