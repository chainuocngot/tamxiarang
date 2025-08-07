import { ethers } from "ethers"
import MulticallAbi from "./Multicall.json"
import ContractAbi from "./Contract.json"
import { multicall } from "./multicall"
import _ from "lodash"

import config from "./hashedMarketConfigKeys.json"
import values from "./hashedMarketValuesKeys.json"
import { useMemo, useState } from "react"

const multicallAddress = "0xcA11bde05977b3631167028862bE2a173976CA11"
const contractAddress = "0xFD70de6b91282D8017aA4E741e9Ae325CAb992d8"

const getProvider = () => {
  return new ethers.providers.StaticJsonRpcProvider(
    "https://arbitrum.drpc.org",
    { chainId: 42161 },
  )
}

function App() {
  const [selectedPool, setSelectedPool] = useState()
  console.log(">> Check | selectedPool:", selectedPool)
  const [table, setTable] = useState()

  const handleChange = (e) => {
    setSelectedPool(e.target.value)
  }

  const merged = useMemo(() => {
    const customizer = (objValue, srcValue) => {
      if (_.isObject(objValue) && _.isObject(srcValue)) {
        return _.mergeWith({}, objValue, srcValue, customizer)
      }

      return objValue ?? srcValue
    }

    return _.mergeWith({}, config, values, customizer)
  }, [])

  const call = async () => {
    const calls = []
    for (const [, hash] of Object.entries(merged[selectedPool])) {
      calls.push({
        address: contractAddress,
        name: "getUint",
        params: [hash],
      })
    }

    const multicallContract = new ethers.Contract(
      multicallAddress,
      MulticallAbi,
      getProvider(),
    )

    const dataMultiCall = await multicall(multicallContract, ContractAbi, calls)

    const table = {}
    for (const index in Object.entries(merged[selectedPool])) {
      const key = Object.entries(merged[selectedPool])[index][0]
      table[key] = dataMultiCall[index][0].toString()
    }

    setTable(table)
  }
  return (
    <>
      <label htmlFor="pool">Choose a pool:</label>
      <select id="pool" value={selectedPool} onChange={handleChange}>
        <option value="">--</option>
        {Object.keys(merged).map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <button disabled={!selectedPool} onClick={call}>
        Call
      </button>

      {table && (
        <table border="1" cellPadding="8" cellSpacing="0">
          <thead>
            <tr>
              <th>Key</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(table).map(([key, value]) => (
              <tr key={key}>
                <td>{key}</td>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}

export default App
