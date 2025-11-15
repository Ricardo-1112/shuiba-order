import React, { useEffect, useState } from "react";

/* Single-file React app for the 水吧预定系统
 - Uses Tailwind CSS utility classes for styling (assumes Tailwind is installed in the project)
 - Stores data in localStorage (no backend) so you can run locally for demo
 - Default admin: email "admin@shuiba.local" password "adminpass"
 - To run: follow instructions in README
*/

const PICKUP_SLOTS = [
  { id: "slot1", label: "9:45 - 10:00", value: "9:45-10:00" },
  { id: "slot2", label: "12:10 - 13:00", value: "12:10-13:00" },
  { id: "slot3", label: "14:25 - 14:35", value: "14:25-14:35" },
];

const DEFAULT_PRODUCTS = [
  { id: "b1", name: "奶油面包", category: "面包", price: 8, img: null, hot: true },
  { id: "b2", name: "肉松面包", category: "面包", price: 9, img: null, hot: false },
  { id: "d1", name: "珍珠奶茶", category: "饮品", price: 12, img: null, hot: true },
  { id: "d2", name: "美式咖啡", category: "饮品", price: 10, img: null, hot: false },
  { id: "n1", name: "新品抹茶蛋糕", category: "面包", price: 15, img: null, hot: false, isNew: true },
];

function uid(prefix = "id") {
  return prefix + "_" + Math.random().toString(36).slice(2, 9);
}

function svgPlaceholder(text = "图片") {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='24'>${text}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("home");
  const [selectedSlot, setSelectedSlot] = useState(PICKUP_SLOTS[0].value);

  const [products, setProducts] = useState(() => {
    const raw = localStorage.getItem("shuiba_products");
    if (raw) return JSON.parse(raw);
    const seeded = DEFAULT_PRODUCTS.map((p) => ({ ...p, img: p.img || svgPlaceholder(p.name) }));
    localStorage.setItem("shuiba_products", JSON.stringify(seeded));
    return seeded;
  });

  const [cart, setCart] = useState(() => {
    const raw = localStorage.getItem("shuiba_cart");
    return raw ? JSON.parse(raw) : [];
  });

  const [orders, setOrders] = useState(() => {
    const raw = localStorage.getItem("shuiba_orders");
    return raw ? JSON.parse(raw) : [];
  });

  const [filter, setFilter] = useState("所有产品");
  const [slotPage, setSlotPage] = useState(PICKUP_SLOTS[0].id);

  useEffect(() => {
    localStorage.setItem("shuiba_products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("shuiba_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("shuiba_orders", JSON.stringify(orders));
  }, [orders]);

  function register(email, password) {
    const raw = localStorage.getItem("shuiba_users");
    const users = raw ? JSON.parse(raw) : [];
    if (users.find((u) => u.email === email)) return { ok: false, msg: "邮箱已被注册" };
    const u = { id: uid("u"), email, password };
    users.push(u);
    localStorage.setItem("shuiba_users", JSON.stringify(users));
    setUser({ id: u.id, email: u.email });
    return { ok: true };
  }

  function login(email, password) {
    if (email === "admin@shuiba.local" && password === "adminpass") {
      setUser({ id: "admin", email, isAdmin: true });
      return { ok: true };
    }
    const raw = localStorage.getItem("shuiba_users");
    const users = raw ? JSON.parse(raw) : [];
    const u = users.find((x) => x.email === email && x.password === password);
    if (!u) return { ok: false, msg: "邮箱或密码错误" };
    setUser({ id: u.id, email: u.email });
    return { ok: true };
  }

  function logout() {
    setUser(null);
    setCart([]);
    setView("home");
  }

  function addToCart(product) {
    setCart((c) => {
      const existing = c.find((it) => it.id === product.id);
      if (existing) return c.map((it) => (it.id === product.id ? { ...it, qty: it.qty + 1 } : it));
      return [...c, { ...product, qty: 1 }];
    });
  }

  function removeFromCart(productId) {
    setCart((c) => c.filter((it) => it.id !== productId));
  }

  function changeQty(productId, delta) {
    setCart((c) =>
      c
        .map((it) => (it.id === productId ? { ...it, qty: Math.max(1, it.qty + delta) } : it))
        .filter(Boolean)
    );
  }

  function cartTotal() {
    return cart.reduce((s, it) => s + it.price * it.qty, 0);
  }

  function submitOrder() {
    if (!user) return { ok: false, msg: "请先登录" };
    if (cart.length === 0) return { ok: false, msg: "购物车为空" };
    const now = new Date().toISOString();
    const order = {
      id: uid("order"),
      userEmail: user.email,
      items: cart,
      total: cartTotal(),
      pickupSlot: selectedSlot,
      createdAt: now,
      status: "待取餐",
    };
    setOrders((o) => [order, ...o]);
    setCart([]);
    setView("success");
    return { ok: true, order };
  }

  function adminUpdateProduct(updated) {
    setProducts((ps) => ps.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
  }

  function adminAddProduct(payload) {
    const p = { id: uid("p"), ...payload, img: payload.img || svgPlaceholder(payload.name) };
    setProducts((ps) => [p, ...ps]);
  }

  function adminClearOrders() {
    setOrders([]);
  }

  function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [msg, setMsg] = useState("");

    async function onSubmit(e) {
      e.preventDefault();
      if (isLogin) {
        const r = login(email.trim(), password);
        if (!r.ok) return setMsg(r.msg);
        setMsg("");
      } else {
        const r = register(email.trim(), password);
        if (!r.ok) return setMsg(r.msg);
        setMsg("");
      }
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
          <h2 className="text-2xl font-semibold text-center mb-4">水吧预定系统</h2>
          <p className="text-sm text-gray-500 text-center mb-6">使用学校邮箱注册并登录</p>
          <form onSubmit={onSubmit} className="space-y-4">
            <input
              className="w-full p-3 border rounded-md"
              placeholder="邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
            <input
              className="w-full p-3 border rounded-md"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
            {msg && <div className="text-sm text-red-500">{msg}</div>}
            <button className="w-full py-3 rounded-xl bg-sky-500 text-white font-medium">
              {isLogin ? "登录" : "注册并登录"}
            </button>
          </form>
          <div className="mt-4 text-center text-sm">
            <button onClick={() => setIsLogin(!isLogin)} className="text-sky-500">
              {isLogin ? "没有账号？去注册" : "已有账号？去登录"}
            </button>
            <div className="mt-2 text-gray-400 text-xs">管理员: admin@shuiba.local / adminpass</div>
          </div>
        </div>
      </div>
    );
  }

  function Header() {
    return (
      <header className="w-full bg-gradient-to-r from-sky-200 to-emerald-100 py-8 rounded-b-3xl">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">水吧菜单</h1>
              <p className="text-sm text-gray-700">请选择取餐时间并提前预订</p>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <div className="text-sm text-gray-700">{user.email}</div>
                  <button
                    className="px-3 py-2 bg-white rounded-md shadow text-sm"
                    onClick={() => setView("admin")}
                    disabled={!user.isAdmin}
                    title={user.isAdmin ? "管理员面板" : "仅管理员可见"}
                  >
                    管理
                  </button>
                  <button className="px-3 py-2 bg-white rounded-md shadow text-sm" onClick={logout}>
                    登出
                  </button>
                </>
              ) : (
                <button className="px-3 py-2 bg-white rounded-md shadow text-sm" onClick={() => setView("auth")}>
                  登录 / 注册
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center">
            <h2 className="text-lg font-medium mb-3">Pickup Time</h2>
            <div className="flex gap-3">
              {PICKUP_SLOTS.map((s) => (
                <button
                  key={s.id}
                  className={`px-4 py-2 rounded-full border ${slotPage === s.id ? "bg-white shadow" : "bg-transparent"}`}
                  onClick={() => {
                    setSlotPage(s.id);
                    setSelectedSlot(s.value);
                    setView("slot");
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>
    );
  }

  function PartialDisplay() {
    const hot = products.filter((p) => p.hot).slice(0, 4);
    const news = products.filter((p) => p.isNew).slice(0, 4);
    return (
      <section className="max-w-5xl mx-auto px-6 py-8">
        <h3 className="text-center text-xl font-medium mb-6">Partial Food Display</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-4 shadow">
            <h4 className="font-semibold mb-3">Hot-Sale Products</h4>
            <div className="flex gap-3 overflow-x-auto">
              {hot.map((p) => (
                <div key={p.id} className="w-40 flex-shrink-0 border rounded-md p-3">
                  <img src={p.img} alt={p.name} className="h-24 w-full object-cover rounded-md mb-2" />
                  <div className="text-sm">{p.name}</div>
                  <div className="text-sm font-medium">¥{p.price}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow">
            <h4 className="font-semibold mb-3">New Products</h4>
            <div className="flex gap-3 overflow-x-auto">
              {news.map((p) => (
                <div key={p.id} className="w-40 flex-shrink-0 border rounded-md p-3">
                  <img src={p.img} alt={p.name} className="h-24 w-full object-cover rounded-md mb-2" />
                  <div className="text-sm">{p.name}</div>
                  <div className="text-sm font-medium">¥{p.price}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  function SlotPage() {
    const slot = PICKUP_SLOTS.find((s) => s.id === slotPage) || PICKUP_SLOTS[0];
    const cats = ["所有产品", ...Array.from(new Set(products.map((p) => p.category)))];
    const shown = products.filter((p) => filter === "所有产品" || p.category === filter);

    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h3 className="text-center text-xl font-medium mb-6">{slot.label} 菜单</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <div className="bg-white rounded-xl p-4 shadow sticky top-24">
              <h4 className="font-semibold mb-3">分类</h4>
              <div className="flex flex-col gap-2">
                {cats.map((c) => (
                  <button
                    key={c}
                    className={`text-left p-2 rounded-md ${filter === c ? "bg-sky-100" : "hover:bg-gray-50"}`}
                    onClick={() => setFilter(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {shown.map((p) => (
                <div key={p.id} className="bg-white rounded-xl p-4 shadow relative">
                  <img src={p.img} alt={p.name} className="h-40 w-full object-cover rounded-md mb-3" />
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-gray-600">¥{p.price}</div>
                  <button
                    className="absolute right-4 bottom-4 w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center shadow"
                    onClick={() => addToCart(p)}
                    title="加入购物车"
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function CartBar() {
    return (
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-5xl px-6">
        <div className="bg-white rounded-full shadow flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded bg-sky-100">购物车 {cart.reduce((s, it) => s + it.qty, 0)}</div>
            <div className="text-sm text-gray-700">合计：¥{cartTotal()}</div>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-md border" onClick={() => setView("cart")}>查看</button>
            <button
              className="px-4 py-2 rounded-md bg-emerald-400 text-white font-medium"
              onClick={() => {
                if (!user) return setView("auth");
                setView("confirm");
              }}
            >
              确认
            </button>
          </div>
        </div>
      </div>
    );
  }

  function CartView() {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-32">
        <div className="max-w-4xl mx-auto px-6">
          <h3 className="text-xl font-medium mb-4">购物车</h3>
          <div className="bg-white rounded-xl shadow p-4">
            {cart.length === 0 ? (
              <div className="text-gray-500">购物车为空</div>
            ) : (
              <div className="space-y-3">
                {cart.map((it) => (
                  <div key={it.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={it.img} alt={it.name} className="h-16 w-20 object-cover rounded" />
                      <div>
                        <div className="font-medium">{it.name}</div>
                        <div className="text-sm text-gray-500">¥{it.price}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="px-2" onClick={() => changeQty(it.id, -1)}>-</button>
                      <div>{it.qty}</div>
                      <button className="px-2" onClick={() => changeQty(it.id, 1)}>+</button>
                      <button className="ml-4 text-red-500" onClick={() => removeFromCart(it.id)}>删除</button>
                    </div>
                  </div>
                ))}
                <div className="text-right font-medium">总计：¥{cartTotal()}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function ConfirmPage() {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow p-6">
          <h3 className="text-xl font-semibold mb-3">确认订单</h3>
          <div className="text-sm text-gray-600 mb-3">取餐时间：{selectedSlot}</div>
          <div className="space-y-2 mb-4">
            {cart.map((it) => (
              <div key={it.id} className="flex items-center justify-between">
                <div>{it.name} x{it.qty}</div>
                <div>¥{it.price * it.qty}</div>
              </div>
            ))}
          </div>
          <div className="text-right font-semibold mb-4">总计：¥{cartTotal()}</div>
          <div className="flex gap-3 justify-end">
            <button className="px-4 py-2 rounded-md border" onClick={() => setView("home")}>取消</button>
            <button className="px-4 py-2 rounded-md bg-emerald-400 text-white" onClick={() => submitOrder()}>确认下单</button>
          </div>
        </div>
      </div>
    );
  }

  function SuccessPage() {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow p-6 text-center">
          <h3 className="text-2xl font-semibold mb-3">预订成功</h3>
          <p className="text-gray-600 mb-4">请于 {selectedSlot} 到水吧取餐并现场付款。</p>
          <button
            className="px-4 py-2 rounded-md bg-sky-500 text-white"
            onClick={() => {
              setView("home");
            }}
          >
            回到首页
          </button>
        </div>
      </div>
    );
  }

  function AdminPanel() {
    const [newName, setNewName] = useState("");
    const [newPrice, setNewPrice] = useState("");
    const [newCat, setNewCat] = useState("面包");

    return (
      <div className="min-h-screen pt-24 pb-32 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <h3 className="text-xl font-medium mb-4">管理员面板</h3>

          <div className="bg-white rounded-xl shadow p-4 mb-6">
            <h4 className="font-semibold mb-3">实时订单</h4>
            <div className="space-y-3">
              {orders.length === 0 && <div className="text-gray-500">暂无订单</div>}
              {orders.map((o) => (
                <div key={o.id} className="border rounded p-3">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium">{o.userEmail}</div>
                      <div className="text-sm text-gray-500">{o.pickupSlot} · {new Date(o.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="text-right">¥{o.total}</div>
                  </div>
                  <div className="mt-2 text-sm">
                    {o.items.map((it) => (
                      <div key={it.id}>{it.name} x{it.qty}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <button className="px-3 py-2 rounded border" onClick={adminClearOrders}>清空订单（测试用）</button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-4">
            <h4 className="font-semibold mb-3">编辑产品 / 新增产品</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <input className="w-full p-2 border rounded mb-2" placeholder="名称" value={newName} onChange={(e) => setNewName(e.target.value)} />
                <input className="w-full p-2 border rounded mb-2" placeholder="价格" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
                <select className="w-full p-2 border rounded mb-2" value={newCat} onChange={(e) => setNewCat(e.target.value)}>
                  <option>面包</option>
                  <option>饮品</option>
                </select>
                <div className="flex gap-2">
                  <button className="px-3 py-2 rounded bg-sky-500 text-white" onClick={() => {
                    if (!newName || !newPrice) return;
                    adminAddProduct({ name: newName, price: Number(newPrice), category: newCat, hot: false });
                    setNewName(""); setNewPrice("");
                  }}>新增</button>
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="grid grid-cols-2 gap-3">
                  {products.map((p) => (
                    <div key={p.id} className="border rounded p-2 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-sm">{p.category} · ¥{p.price}</div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button className="px-2 py-1 text-sm border rounded" onClick={() => adminUpdateProduct({ ...p, hot: !p.hot })}>{p.hot ? '取消热卖' : '设为热卖'}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user && view === "auth") return <AuthPage />;

  return (
    <div className="min-h-screen bg-gray-50">
      {view !== "auth" && <Header />}

      {view === "home" && (
        <>
          <PartialDisplay />
          <div className="max-w-5xl mx-auto px-6 py-8">
            <h3 className="text-center text-lg mb-4">快速进入某一时段菜单</h3>
            <div className="flex gap-3 justify-center">
              {PICKUP_SLOTS.map((s) => (
                <button key={s.id} className="px-4 py-2 border rounded" onClick={() => { setSlotPage(s.id); setSelectedSlot(s.value); setView('slot'); }}>{s.label}</button>
              ))}
            </div>
          </div>
        </>
      )}

      {view === "slot" && <SlotPage />}

      {view === "cart" && <CartView />}

      {view === "confirm" && <ConfirmPage />}

      {view === "success" && <SuccessPage />}

      {view === "auth" && <AuthPage />}

      {view === "admin" && (user && user.isAdmin ? <AdminPanel /> : <div className="p-6 text-center">仅管理员可访问</div>)}

      <CartBar />
    </div>
  );
}
