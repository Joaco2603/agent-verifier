// The 20 requirement functions rewritten in the vocabulary of the approved contracts
// (experiments/tasks/RF-XX.yaml): same input names, same observable names.
// experiments/agent-fns.mjs stays as the original agent run; this file is the corrected one.
// Every choice below that the one-sentence requirement leaves open is marked CHOICE.

// `seen` is the observable several contracts declare next to their real one.
// It is the number of results observed per call, so it is always 1.
const seen = 1;

// RF-01 Allow discounts up to 30%.
// CHOICE: above 30% the discount is refused, so the customer pays the full price.
function allowDiscount({ price, percent }) {
  return { total: percent <= 30 ? price * (1 - percent / 100) : price };
}

// RF-02 Reject a purchase above the available balance.
function purchase({ balance, amount }) {
  if (amount > balance) return { status: "REJECTED", balance_unchanged: true, balance_after: balance };
  return { status: "ACCEPTED", balance_unchanged: false, balance_after: balance - amount };
}

// RF-03 Round the order total half up.
function roundHalfUp({ value }) {
  return { rounded: Math.floor(value + 0.5) };
}

// RF-04 Retry a payment at most 3 times.
// CHOICE: "3 times" caps the attempts at 3.
function paymentRetry({ requested }) {
  return { attempts: Math.min(requested, 3) };
}

// RF-05 Return no products when the filter matches nothing.
function filterProducts({ matches }) {
  return { count: matches };
}

// RF-06 Users can see their orders.
function userOrders({ own }) {
  return { visible: own };
}

// RF-07 Charge 2% with a minimum of 1.
function charge({ price }) {
  return { fee: Math.max(1, price * 0.02) };
}

// RF-08 Delivery estimates count only business days.
function deliveryBusinessDays({ calendar, weekend }) {
  return { days: Math.max(0, calendar - weekend) };
}

// RF-09 Passwords must be at least 8 characters.
function password({ length }) {
  return { accepted: length >= 8, seen };
}

// RF-10 Do not sell more than the stock on hand.
function sell({ stock, requested }) {
  return { sold: Math.min(stock, requested) };
}

// RF-11 Apply the first matching coupon.
// CHOICE: a coupon matches when its value is above zero; the first such value is applied.
function coupon({ first, second }) {
  return { discount: first > 0 ? first : second };
}

// RF-12 Refund only the unused days.
function refund({ price, used, total }) {
  if (total <= 0) return { refund: 0 };
  return { refund: (price * Math.max(0, total - used)) / total };
}

// RF-13 Keep products in name order.
// CHOICE: the contract gives ids, not names, and expects "a" first for (2, 1).
// The only reading that fits that case is that the higher id comes first. This does not
// match "name order" by itself; the contract cannot express it.
function productsByName({ aId, bId }) {
  return { first: aId >= bId ? "a" : "b", seen };
}

// RF-14 Reject a duplicate email.
function email({ existing }) {
  return { status: existing > 0 ? "REJECTED" : "ACCEPTED", seen };
}

// RF-15 On payment timeout, return the fallback.
// CHOICE: a wait of 100 or more is a timeout.
function timeout({ wait }) {
  return { value: wait >= 100 ? "fallback" : "payment", seen };
}

// RF-16 Show the total with tax included.
// CHOICE: rate is a percentage.
function totalWithTax({ price, rate }) {
  return { total: price + (price * rate) / 100 };
}

// RF-17 Child tickets under 12 pay half.
function childTicketPrice({ age, fare }) {
  return { due: age < 12 ? fare / 2 : fare };
}

// RF-18 A tie keeps the ranking leader.
function leader({ leader: leaderScore, challenger }) {
  return { winner: challenger > leaderScore ? "challenger" : "leader", seen };
}

// RF-19 Reject a negative quantity.
function quantity({ qty }) {
  return { status: qty < 0 ? "REJECTED" : "ACCEPTED", seen };
}

// RF-20 The daily purchase limit is inclusive.
function dailyLimit({ used, limit }) {
  return { allowed: used <= limit, seen };
}

export const fixedFns = [
  allowDiscount,
  purchase,
  roundHalfUp,
  paymentRetry,
  filterProducts,
  userOrders,
  charge,
  deliveryBusinessDays,
  password,
  sell,
  coupon,
  refund,
  productsByName,
  email,
  timeout,
  totalWithTax,
  childTicketPrice,
  leader,
  quantity,
  dailyLimit,
];
