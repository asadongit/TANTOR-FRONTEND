import { useStateContext } from "../../../context/contextProvider";

export function BusinessFooter() {
    
      const { handleConsolidationPayload,joinPayload,handleJoinPayload  } = useStateContext("");

      const handleClick =()=>{
        console.log("join payload is ===>",joinPayload)
    
    
        const tempArray1 = new Set();
        const tempArray2 = new Set();
    
        joinPayload.joins.forEach((join) => {
          const { view1, view2 } = join;
    
          if (!tempArray2.has(view1)) {
            tempArray1.add(view1);
          }
          if (!tempArray1.has(view2)) {
            tempArray2.add(view2);
          }
    
          tempArray1.delete(view2);
        });
    
        console.log("temp array1",Array.from(tempArray1));
        console.log("tep array 2",Array.from(tempArray2));
    
        handleJoinPayload({
          ...joinPayload,
          base_join: Array.from(tempArray1)[0]
        });
    
      }
    return (
        <div className='bg-white w-full py-3.5 flex justify-end'>
      {/* <button
        onClick={handleClick}
        className="bg-[#8e78b7] text-white px-4 py-1.5 rounded shadow"
      >
       Next
      </button> */}
      <div className="mr-3">
                <button
                  type="button"
                  className="text-black bg-white hover:bg-gray-50 focus:ring-1  rounded-lg text-sm px-8 py-1.5 me-2 focus:outline-none border-solid border-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClick}
                  className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-8 py-1.5 me-2 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
                >
                  Next
                </button>
              </div>
      </div>
    )
}