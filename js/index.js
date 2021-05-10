var stakedCPU = 0

const round = (num, places) => {
  return Math.round(num * Math.pow(10, places)) / Math.pow(10, places)
}

const getCPU = (accountData) => {
  fetch("https://wax.greymass.com/v1/chain/get_account", {
    method: "POST",
    body: JSON.stringify(accountData)
  }).then(res => {
    return res.json()
  }).then(data => {
    var available = (data.cpu_limit.used / data.cpu_limit.max) * 100
    stakedCPU = parseFloat(data.self_delegated_bandwidth.cpu_weight.split(" ")[0])
    let cpuPercent = round(available, 2)
    $("div#cpu").text(cpuPercent + "%")

    if (cpuPercent >= 100) {
      $("div#myBar").css("background-color", "red")
    } else {
      $("div#myBar").css("background-color", "green")
    }
    $("div#myBar").css("width", `${cpuPercent >= 100 ? 100 : cpuPercent}%`)
  })
}

const getTokens = (accountData) => {
  fetch(`https://eosauthority.com/api/spa/account/${accountData.account_name}/tokens?network=wax`, {
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
      tokenData.forEach((token) => {
        console.log(token)
        let convData = data.rows.find(row => row.pool2.quantity.includes(token.symbol) || row.pool1.quantity.includes(token.symbol))
        console.log(convData)
        let waxPool = convData.pool1.quantity.includes("WAX") ? convData.pool1 : convData.pool2
        let tokenPool = convData.pool1.quantity.includes(token.symbol) ? convData.pool1 : convData.pool2
        let waxQuantity = parseFloat(waxPool.quantity.split(" ")[0])
        let tokenQuantity = parseFloat(tokenPool.quantity.split(" ")[0])
        let tokenToWax = waxQuantity / tokenQuantity


        if (token.symbol === "WAX") {
          totalWax += stakedCPU
          $("table#tokens").append(`<tr><td>${token.symbol}</td><td>${token.amount}</td><td>1</td><td>${token.amount}</td></tr>`)
        } else {
          let estWax = round(token.amount * tokenToWax, 3)
          totalWax += estWax
          $("table#tokens").append(`<tr><td>${token.symbol}</td><td>${token.amount}</td><td>${round(tokenToWax, 3)}</td><td>${round(estWax, 3)}</td></tr>`)
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
  getCPU(data)
  getTokens(data)

  intervalId = setInterval(() => {
    getCPU(data)
    getTokens(data)
  }, 10000)
}
