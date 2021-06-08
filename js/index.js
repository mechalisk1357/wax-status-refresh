var stakedCPU = 0

const round = (num, places) => {
  if (typeof places === "string") {
    return Math.round(num * Math.pow(10, parseInt(places))) / Math.pow(10, parseInt(places))
  }
  return Math.round(num * Math.pow(10, places)) / Math.pow(10, places)
}

const setProgress = (id, current, max) => {
  var available = (current / max) * 100
  var percent = round(available, 2)
  $(`div#${id}`).text(`${percent}% (${current} / ${max})`)
  if (percent >= 100) {
    $(`div#${id}Bar`).css("background-color", "red")
  } else {
    $(`div#${id}Bar`).css("background-color", "green")
  }
  $(`div#${id}Bar`).css("width", `${percent >= 100 ? 100 : percent}%`)
}

const getCPUandRAM = (accountData) => {
  fetch("https://wax.greymass.com/v1/chain/get_account", {
    method: "POST",
    body: JSON.stringify(accountData)
  }).then(res => {
    return res.json()
  }).then(data => {
    stakedCPU = parseFloat(data.self_delegated_bandwidth.cpu_weight.split(" ")[0])
    setProgress("cpu", data.cpu_limit.used, data.cpu_limit.max)
    setProgress("ram", data.ram_usage, data.ram_quota)
  })
}

const getTokens = (accountData) => {
  fetch(`https://lightapi.eosamsterdam.net/api/balances/wax/${accountData.account_name}`, {
    method: "GET"
  }).then(res => {
    return res.json()
  }).then(tokenData => {
    let swapPriceData = {
      "json": true,
      "code": "alcorammswap",
      "scope": "alcorammswap",
      "table": "pairs",
      "lower_bound": "",
      "upper_bound": "",
      "index_position": 1,
      "key_type": "",
      "limit": 1000,
      "reverse": false,
      "show_payer": false
    }
    fetch("https://wax.greymass.com/v1/chain/get_table_rows", {
      method: "POST",
      body: JSON.stringify(swapPriceData)
    }).then(res => {
      return res.json()
    }).then(data => {
      var totalWax = 0

      $("table#tokens").empty()
      $("table#tokens").append(`
        	<tr>
            <th>Symbol</th>
            <th>Amount</th>
            <th>Wax Ratio</th>
            <th>Total Wax</th>
          </tr>
   			`)
      tokenData.balances.forEach((token) => {
        console.log(token)
        let convData = data.rows.find(row => row.pool2.quantity.includes(token.currency) || row.pool1.quantity.includes(token.currency))
        console.log(convData)
        let waxPool = convData.pool1.quantity.includes("WAX") ? convData.pool1 : convData.pool2
        let tokenPool = convData.pool1.quantity.includes(token.currency) ? convData.pool1 : convData.pool2
        let waxQuantity = parseFloat(waxPool.quantity.split(" ")[0])
        let tokenQuantity = parseFloat(tokenPool.quantity.split(" ")[0])
        console.log(waxQuantity, tokenQuantity)
        let tokenToWax = waxQuantity / tokenQuantity
        console.log(tokenToWax)


        if (token.currency === "WAX") {
          totalWax += stakedCPU
          $("table#tokens").append(`<tr><td>${token.currency}</td><td>${token.amount}</td><td>1</td><td>${token.amount}</td></tr>`)
        } else {
          let estWax = round(token.amount * tokenToWax, 3)
          totalWax += estWax
          $("table#tokens").append(`<tr><td>${token.currency}</td><td>${token.amount}</td><td>${round(tokenToWax, token.decimals)}</td><td>${round(estWax, 3)}</td></tr>`)
        }
      })
      $("table#tokens").append(`<tr><td>Staked</td><td></td><td>1</td><td>${stakedCPU}</td></tr>`)
      $("table#tokens").append(`<tr><td>Total</td><td></td><td></td><td>${totalWax}</td></tr>`)
      $("#data").removeClass("hidden")
    })
  })
}

var intervalId;

const stopPolling = () => {
  console.log("Clearing Interval", intervalId)
  clearInterval(intervalId)
}

const submitAccountAddress = () => {
  if (intervalId) {
    console.log("Clearing Interval", intervalId)
    clearInterval(intervalId)
  }

  let data = {
    account_name: $("#address").val()
  }
  $("div#test").text($("#address").val())
  getCPUandRAM(data)
  getTokens(data)

  intervalId = setInterval(() => {
    getCPUandRAM(data)
    getTokens(data)
  }, 10000)
}
