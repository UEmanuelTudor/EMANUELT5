import { useEffect, useState } from 'react'

function App() {
  const [page, setPage] = useState('Dashboard')
  const [shopItems, setShopItems] = useState([])
  const [loadingShop, setLoadingShop] = useState(false)
  const [shopError, setShopError] = useState('')

  useEffect(() => {
    async function loadShop() {
      try {
        setLoadingShop(true)
        setShopError('')

        const response = await fetch('https://fortnite-api.com/v2/shop')
        const result = await response.json()

        const entries = result.data?.entries || []

        const items = entries
          .map((entry) => {
            const item =
              entry.brItems?.[0] ||
              entry.tracks?.[0] ||
              entry.instruments?.[0] ||
              entry.cars?.[0]

            return {
              id: entry.offerId,
              name: item?.name || item?.title || 'Fortnite Item',
              image:
                item?.images?.icon ||
                item?.images?.smallIcon ||
                item?.albumArt ||
                entry.newDisplayAsset?.renderImages?.[0]?.image,
              price: entry.finalPrice || entry.regularPrice || 0,
            }
          })
          .filter((item) => item.image)

        setShopItems(items)
      } catch (error) {
        setShopError('Nu s-a putut incarca shop-ul Fortnite.')
      } finally {
        setLoadingShop(false)
      }
    }

    if (page === 'Shop Fortnite') {
      loadShop()
    }
  }, [page])

  return (
    <main className="app">
      <aside className="sidebar">
        <h1>EMANUELT5 Hub</h1>

        <nav>
          <button onClick={() => setPage('Dashboard')}>Dashboard</button>
          <button onClick={() => setPage('Sustinatori')}>Sustinatori</button>
          <button onClick={() => setPage('Puncte')}>Puncte</button>
          <button onClick={() => setPage('Gifturi')}>Gifturi</button>
          <button onClick={() => setPage('Shop Fortnite')}>Shop Fortnite</button>
          <button onClick={() => setPage('Leaderboard')}>Leaderboard</button>
          <button onClick={() => setPage('Admin')}>Admin</button>
        </nav>
      </aside>

      <section className="content">
        {page === 'Dashboard' && (
          <>
            <p className="tag">Fortnite Community System</p>
            <h2>Dashboard</h2>
            <p>
              Aici vom construi sistemul pentru sustinatori, puncte, gifturi si
              shop-ul zilnic Fortnite.
            </p>
          </>
        )}

        {page === 'Shop Fortnite' && (
          <>
            <p className="tag">Se actualizeaza automat zilnic</p>
            <h2>Shop Fortnite</h2>

            {loadingShop && <p>Se incarca shop-ul...</p>}
            {shopError && <p>{shopError}</p>}

            <div className="shop-grid">
              {shopItems.map((item) => (
                <article className="shop-card" key={item.id}>
                  <img src={item.image} alt={item.name} />
                  <h3>{item.name}</h3>
                  <p>{item.price} V-Bucks</p>
                </article>
              ))}
            </div>
          </>
        )}

        {page !== 'Dashboard' && page !== 'Shop Fortnite' && (
          <>
            <p className="tag">In constructie</p>
            <h2>{page}</h2>
            <p>Aceasta sectiune va fi construita mai tarziu.</p>
          </>
        )}
      </section>
    </main>
  )
}

export default App