export const updateCart = (state) => {
  //Calculate items price
  state.itemsPrice = state.cartItems.reduce(
    (acc, item) => acc + item.price * item.qty,
    0
  );
  //Calculate shipping price
  state.shippingPrice = state.itemsPrice > 400000 ? 0 : 30000;
  //Calculate total price
  state.totalPrice = Number(state.itemsPrice) + Number(state.shippingPrice);

  localStorage.setItem("cart", JSON.stringify(state));

  return state;
};
