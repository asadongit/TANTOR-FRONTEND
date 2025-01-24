import { Icon } from "@iconify-icon/react";

const MigrationEmpty = () => {
  return (
    <div className="p-6">
      <div className="flex gap-2 mb-6 items-center justify-between">
        <h1 className="text-2xl font-semibold font-semibold">Migration</h1>
      </div>
      <div className="bg-gray-50 p-8 rounded-lg shadow-sm w-full text-center outline outline-slate-100">
        <Icon icon="ic:baseline-move-down" width="48" height="48" className="text-gray-300"/>
        <h2 className="text-black-500 text-3xl mb-4 font-semibold w-full block">
          Sorry, no migration found
        </h2>
        <p className="text-gray-500 text-lg mb-4">
          There are no item with this data.
        </p>
        <button className="bg-[#8e78b7] text-white px-5 py-2.5 rounded-md hover:bg-[#8e78b7] transition-colors text-sm font-medium">
          Create Migration
        </button>
      </div>
    </div>
  );
};

export default MigrationEmpty;
