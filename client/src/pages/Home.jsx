function Home() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Total Products</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">1,250</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Low Stock Items</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">42</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Total Sales</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">₹45,328</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to IntelliStock</h2>
        <p className="text-gray-600 mb-4">
          IntelliStock is your smart inventory management system. Use the navigation menu to:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          <li>View and manage your product inventory</li>
          <li>Track sales and transactions</li>
          <li>Monitor low stock items</li>
          <li>Generate detailed reports with ML predictions</li>
          <li>Access real-time dashboard analytics</li>
        </ul>
      </div>
    </div>
  )
}

export default Home
