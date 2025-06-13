import { useState } from "react";
import Breadcrumb from "../../../components/Breadcrumb";
import {
    Trash2,
    MoreHorizontal,
    RotateCw,
    List,
    RefreshCcw,
    Code,
    Plus,
    LinkIcon,
    Search,
    MoreVertical,
    Pencil,
} from "lucide-react";
import { Icon } from "@iconify-icon/react";
import { useNavigate } from "react-router-dom";


const Toggle = ({ enabled, onToggle }) => {
    return (
        <div
            onClick={onToggle}
            className={`relative inline-flex h-5 w-10 cursor-pointer rounded-full transition-colors ease-in-out duration-200 ${enabled ? "bg-[#1a9962]" : "bg-red-500"
                }`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ease-in-out duration-200 m-0.5 ${enabled ? "translate-x-5" : "translate-x-0"
                    }`}
            />
        </div>
    );
};

const Protection = () => {
    const [cards, setCards] = useState
        ([
            {
                title: "GDPR",
                enabled: true,
                icon: "material-symbols:tab-group-outline",
                bgcolor: "bg-[#8d77ba] bg-opacity-25",
                iconcolor: "text-[#8d77ba]",
                seeDetailsLink: "/data-shield/protection/gdpr",
            },
            {
                title: "PCI DSS",
                enabled: true,
                icon: "material-symbols:tab-group-outline",
                bgcolor: "bg-[#8d77ba] bg-opacity-25",
                iconcolor: "text-[#8d77ba]",
                seeDetailsLink: "/data-shield/protection/pci_dss",
            },
            {
                title: "DPDP",
                enabled: false,
                icon: "material-symbols:tab-group-outline",
                bgcolor: "bg-[#8d77ba] bg-opacity-25",
                iconcolor: "text-[#8d77ba]",
                seeDetailsLink: "/data-shield/protection/dpdp",
            }
        ]);

    const toggleProtection = (index) => {
        const newCards = [...cards];
        newCards[index].enabled = !newCards[index].enabled;
        setCards(newCards);
    };

    const navigate = useNavigate();

    const [sampleData, setSampleData] = useState([
        { id: '1', Name: 'Data agent', Description: 'Outline was access data', CreatedDate: '26/01/2025', updatedDate: '27/01/2025', EffectiveDate: '27/01/2025', Status: 'Active', Creator: 'John Doe', Approver: 'Vivek Raj', Select: false },
        { id: '1', Name: 'Data agent', Description: 'Outline was access data', CreatedDate: '26/01/2025', updatedDate: '27/01/2025', EffectiveDate: '27/01/2025', Status: 'Active', Creator: 'John Doe', Approver: 'Vivek Raj', Select: false },
        { id: '1', Name: 'Data agent', Description: 'Outline was access data', CreatedDate: '26/01/2025', updatedDate: '27/01/2025', EffectiveDate: '27/01/2025', Status: 'Draft', Creator: 'John Doe', Approver: 'Vivek Raj', Select: false },
        { id: '1', Name: 'Data agent', Description: 'Outline was access data', CreatedDate: '26/01/2025', updatedDate: '27/01/2025', EffectiveDate: '27/01/2025', Status: 'Active', Creator: 'John Doe', Approver: 'Vivek Raj', Select: false },
        { id: '1', Name: 'Data agent', Description: 'Outline was access data', CreatedDate: '26/01/2025', updatedDate: '27/01/2025', EffectiveDate: '27/01/2025', Status: 'Active', Creator: 'John Doe', Approver: 'Vivek Raj', Select: false },
        { id: '1', Name: 'Data agent', Description: 'Outline was access data', CreatedDate: '26/01/2025', updatedDate: '27/01/2025', EffectiveDate: '27/01/2025', Status: 'Draft', Creator: 'John Doe', Approver: 'Vivek Raj', Select: false },
        { id: '1', Name: 'Data agent', Description: 'Outline was access data', CreatedDate: '26/01/2025', updatedDate: '27/01/2025', EffectiveDate: '27/01/2025', Status: 'Draft', Creator: 'John Doe', Approver: 'Vivek Raj', Select: false },
        { id: '1', Name: 'Data agent', Description: 'Outline was access data', CreatedDate: '26/01/2025', updatedDate: '27/01/2025', EffectiveDate: '27/01/2025', Status: 'Active', Creator: 'John Doe', Approver: 'Vivek Raj', Select: false },
    ]);

    const [selectAll, setSelectAll] = useState(false);

    const handleSelectAll = () => {
        const newSelectAll = !selectAll;
        setSelectAll(newSelectAll);
        setSampleData(prev =>
            prev.map(item => ({ ...item, Select: newSelectAll }))
        );
    };

    const handleSelectRow = (index) => {
        const updated = [...sampleData];
        updated[index].Select = !updated[index].Select;
        setSampleData(updated);
        setSelectAll(updated.every(row => row.Select));
    };


    const [activeMenu, setActiveMenu] = useState(null);

    const handleClickOutside = () => {
        setActiveMenu(null);
    };
    return (
        <div className="w-full h-full">
      <Breadcrumb/>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Protection</h1>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Search Protection"
                            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <button
                        type="button"
                        className="text-black border border-gray-300 shadow-lg hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-3 py-2.5 me-2 dark:bg-[#ffffff] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
                    >
                        <List className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        className="text-black border border-gray-300 shadow-lg hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-3 py-2.5 me-2 dark:bg-[#ffffff] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
                    >
                        <RefreshCcw className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        // onClick={toggleModal}
                        className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-4 py-2.5 me-2 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
                    >
                        <div className="flex justify-between">
                            <Plus className="h-5 w-5 mr-1" />
                            Add Protection
                        </div>
                    </button>
                </div>
            </div>

            <div className="mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cards.map((card, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-lg shadow-sm border border-gray-100"
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 ${card.bgcolor} rounded-full ${card.iconcolor} mr-2`}
                                        >
                                            <Icon icon={card.icon} />
                                        </div>
                                        <h3 className="text-lg font-semibold">{card.title}</h3>
                                    </div>
                                    <button className="p-1 rounded-lg hover:bg-gray-100">
                                        <MoreVertical className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between mt-6">
                                    <a
                                        className="text-sm text-[#8d77ba] font-medium underline cursor-pointer opacity-90"
                                        onClick={() => navigate(`${card.seeDetailsLink}`)}
                                    >
                                        See details
                                    </a>

                                    <div className="flex items-center gap-2">
                                        <Toggle
                                            enabled={card.enabled}
                                            onToggle={() => toggleProtection(index)}
                                        />
                                        <span
                                            className={`text-sm ${card.enabled ? "text-[#1a9962]" : "text-red-500"
                                                }`}
                                        >
                                            {card.enabled ? "Enabled" : "Disabled"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow mt-5 overflow-x-auto">
                <table className="w-full table-auto">
                    <thead>
                        <tr className="bg-[#29304a] text-white">
                            <th className="text-left p-4">Id</th>
                            <th className="text-left p-4">Name</th>
                            <th className="text-left p-4">Description</th>
                            <th className="text-left p-4">Created Date</th>
                            <th className="text-left p-4">Updated Date</th>
                            <th className="text-left p-4">Effective Date</th>
                            <th className="text-center p-4">Status</th>
                            <th className="text-left p-4">Creator</th>
                            <th className="text-left p-4">Approver</th>
                            <th className="p-4">
                                <div className="flex items-center justify-center gap-2">
                                    <span>Select All</span>
                                    <input
                                        type="checkbox"
                                        checked={selectAll}
                                        onChange={handleSelectAll}
                                    />
                                </div>
                            </th>

                            <th className="text-left p-4">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sampleData.map((user, index) => (
                            <tr key={index} className="border-b">
                                <td className="p-4 text-gray-500">{user.id}</td>
                                <td className="p-4 text-gray-500">{user.Name}</td>
                                <td className="p-4 text-gray-500">{user.Description}</td>
                                <td className="p-4 text-gray-500 text-center">{user.CreatedDate}</td>
                                <td className="p-4 text-gray-500 text-center">{user.updatedDate}</td>
                                <td className="p-4 text-gray-500 text-center">{user.EffectiveDate}</td>
                                <td className="p-4 text-center">
                                    <span
                                        className={`px-5 py-1 rounded text-sm font-normal inline-block ${user.Status === "Active"
                                            ? "text-green-600 bg-green-200"
                                            : "text-gray-400 bg-gray-200"
                                            }`}
                                    >
                                        {user.Status}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-500">{user.Creator}</td>
                                <td className="p-4 text-gray-500">{user.Approver}</td>
                                <td className="p-4 text-gray-500 text-center">
                                    <input
                                        type="checkbox"
                                        className="transform scale-125"
                                        checked={user.Select}
                                        onChange={() => handleSelectRow(index)}
                                    />
                                </td>
                                <td className="px-6 p-4 text-center">
                                    <div className="relative">
                                        <button
                                            onClick={() => setActiveMenu(activeMenu === index ? null : index)}
                                            className="p-1.5 rounded-full hover:bg-gray-100"
                                        >
                                            <MoreHorizontal className="h-5 w-5" />
                                        </button>

                                        {activeMenu === index && (
                                            <>
                                                <div className="fixed inset-0 z-100" onClick={handleClickOutside} />
                                                <div className="absolute top-2 right-7 bg-white rounded-lg shadow-lg border z-20 animate-fadeIn">
                                                    <div className="flex items-center p-1 gap-1">
                                                        <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                                            <Pencil className="h-4 w-4" />
                                                        </button>
                                                        <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                        <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                                            <RotateCw className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default Protection;