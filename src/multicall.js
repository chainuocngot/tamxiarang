import { Interface } from "ethers/lib/utils"

export const multicall = async (multi, abi, calls) => {
  const itf = new Interface(abi)

  const calldata = calls.map((call) => [
    call?.address?.toLowerCase(),
    itf.encodeFunctionData(call.name, call.params),
  ])
  const { returnData } = await multi.aggregate(calldata)
  const res = returnData.map((call, i) =>
    itf.decodeFunctionResult(calls[i].name, call),
  )

  return res
}
