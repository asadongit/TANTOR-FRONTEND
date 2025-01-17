const Dashboard = () => {
  const cards = [
    {
      title: 'Migration',
      description: 'Data movement transfers data across systems using ETL, batch, or streaming methods.',
      type: 'platform'
    },
    {
      title: 'CDC',
      description: 'Change Data Capture (CDC) identifies and tracks data changes in real-time.',
      type: 'platform'
    },
    {
      title: 'Federation',
      description: 'Federated data integrates distributed datasets from multiple sources.',
      type: 'platform'
    },
    {
      title: 'Transformation',
      description: 'Transform and process data for analytics and business needs.',
      type: 'platform'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto">


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
            <p className="text-gray-600 text-sm">{card.description}</p>
            <button className="mt-4 text-purple-600 text-sm hover:text-purple-700">
              See details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;