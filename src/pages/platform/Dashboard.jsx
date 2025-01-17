import { Icon } from '@iconify-icon/react';

const Dashboard = () => {
  const cards = [
    {
      icon:"material-symbols:database-upload-outline" ,
      bgcolor: 'bg-[#d8d3e4]',
      iconcolor: 'text-purple-700',
      title: 'Migration',
      description: 'Data movement transfers data across systems using ETL, batch, or streaming methods, enabling integration, processing, and maintaining data integrity.',
      type: 'platform'
    },
    {
      icon:"material-symbols-light:two-pager-store-outline",
      bgcolor: 'bg-[#FFC93F]',
      iconcolor: 'text-orange-700',
      title: 'Purge',
      description: 'AI data fuels machine learning models, encompassing structured and unstructured datasets, enabling training, predictions, and decision-making for intelligent systems and applications.',
      type: 'platform'
    },
    {
      icon: "material-symbols:cloud-sync-outline",
      bgcolor: 'bg-[#96CF7B]',
      iconcolor: 'text-green-700',
      title: 'CDC',
      description: 'Change Data Capture (CDC) identifies and tracks data changes in real-time, enabling efficient updates and synchronization across systems or databases.',
      type: 'platform'
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: 'bg-[#16ABC2] Opacity-25',
      iconcolor: 'text-cyan-700',
      title: 'Federation',
      description: 'Federated data integrates distributed datasets from multiple sources, enabling unified access, analysis, and collaboration without centralizing or duplicating data storage.',
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
            <div className="flex items-center mb-2">
              <div className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 ${card.bgcolor} rounded-full ${card.iconcolor} mr-2`}>
              <Icon icon={card.icon} />
              </div>
              <h3 className="text-lg font-semibold">{card.title}</h3>
            </div>
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