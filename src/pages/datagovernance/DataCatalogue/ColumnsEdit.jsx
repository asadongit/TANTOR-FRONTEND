import { Pencil, CircleX, Plus } from 'lucide-react';


const ColumnsEdit = ({onClose, columnData, editColumnDetails}) => {
  
  return (
    <div className='flex flex-col justify-between h-full'>
      
      <div className=''>
        {/* top section */}
        <div className='flex justify-between items-center p-6 pb-5 border-b flex-shrink-0'>
          <div className='flex items-center gap-x-3 text-purple-500'>
            <span>
              <Pencil className="w-4 h-4"/>
            </span>
            <span className='font-semibold'>
              Edit Column
            </span>
          </div>

          <button 
            onClick={onClose} aria-label="Close"
            className='text-gray-500 hover:text-gray-600'>
            <CircleX className="w-5 h-5"/>
          </button>
        </div>

        {/* Middle section */}
        <div className='flex flex-col items-start gap-5 p-6 pt-6 text-sm overflow-y-auto'>
          {/* top users */}
          <div>
            <div className='mb-2'>Top users</div>
            <div className='text-gray-500'>
              <p>ABCD</p>
              <p>ABCD</p>
              <p>ABCD</p>
            </div>
          </div>

          {/* DOMAIN */}
          <div className='w-full'>
            <div className='mb-2'>Domain</div>
            <div className='flex justify-between gap-x-2'>
              <select className='w-full border rounded-md p-2
                focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500'>
                <option>Select</option>
                <option>ABCD</option>
                <option>ABCD</option>
              </select>

              <button 
                className='flex border border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white
                  p-2 rounded-md'>
                Add <Plus />
              </button>
            </div>
          </div>

          {/* Category */}
          <div className='w-full'>
            <div className='mb-2'>Category</div>
            <select className='w-full border rounded-md p-2
              focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500'>
              <option>Select</option>
              <option>ABCD</option>
              <option>ABCD</option>
            </select>
          </div>

          {/* Sub Category */}
          <div className='w-full'>
            <div className='mb-2'>Sub-Category</div>
            <select className='w-full border rounded-md p-2
              focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500'>
              <option>Select</option>
              <option>ABCD</option>
              <option>ABCD</option>
            </select>
          </div>

          {/* Tags */}
          <div className='w-full'>
            <div className='mb-2'>Tags</div>
            <div className='flex justify-between gap-x-2'>
            <select className='w-full border rounded-md p-2
                focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500'>
                <option>Select</option>
                <option>ABCD</option>
                <option>ABCD</option>
            </select>

              <button 
                className='flex border border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white
                  p-2 rounded-md'>
                Add <Plus />
              </button>
            </div>
          </div>

          {/* Sub tags */}
          <div className='w-full'>
            <div className='mb-2'>Sub-tags</div>
            <select className='w-full border rounded-md p-2
              focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500'>
              <option>Select</option>
              <option>ABCD</option>
              <option>ABCD</option>
            </select>
          </div>

          {/* terms */}
          <div className='w-full'>
            <div className='mb-2'>Terms</div>
            <select className='w-full border rounded-md p-2
              focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500'>
              <option>Select</option>
              <option>ABCD</option>
              <option>ABCD</option>
            </select>
          </div>

        </div>
      </div>

      {/* Footer section */}
      <div className='flex justify-end border-t p-5 mb-4 text-sm gap-x-4'>
        <button 
          onClick={onClose}
          className='w-36 h-10 border border-gray-400 text-gray-400 p-2 rounded-md hover:bg-purple-600 hover:text-white'>
          Cancel
        </button>
        <button className='w-36 h-10 p-2 border border-purple-600 rounded-md text-purple-600 hover:bg-purple-600 hover:text-white'>Save</button>
      </div>
    </div>
  )
};

export default ColumnsEdit;
