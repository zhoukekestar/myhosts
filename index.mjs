import { Resolver } from 'node:dns/promises'
import * as childprocess from 'node:child_process'
import { stdout } from 'node:process'
import fs from 'fs'
import util from 'node:util'

const exec = util.promisify(childprocess.exec)
const execSync = childprocess.execSync

async function getDNSList (args) {
  let dns = [
    '1.1.1.1',
    '4.4.4.4',
    '223.5.5.5',
    '223.6.6.6',
    '114.114.114.114',
    '8.8.4.4',
    '8.8.8.8'
  ]
  const dnsFilePath = new URL('./dns.json', import.meta.url)

  if (
    fs.existsSync(dnsFilePath) &&
    args.indexOf('--disable-dns-cache') === -1
  ) {
    console.log('Use DNS cache, add --disable-dns-cache to refresh.')
    dns = JSON.parse(String(fs.readFileSync(dnsFilePath)))
  } else {
    console.log('Fetching DNS list...')
    let list = []
    const urls = [
      'https://public-dns.info/nameserver/sg.json',
      // 'https://public-dns.info/nameserver/cn.json',
      'https://public-dns.info/nameserver/am.json',
      'https://public-dns.info/nameserver/jp.json',
      // 'https://public-dns.info/nameserver/fr.json',
      // 'https://public-dns.info/nameserver/it.json',
      // 'https://public-dns.info/nameserver/ru.json',
      'https://public-dns.info/nameserver/hk.json'
      // 'https://public-dns.info/nameserver/in.json',
      // 'https://public-dns.info/nameserver/au.json'
    ]
    for (let i = 0; i < urls.length; i++) {
      list = list.concat(
        (await fetch(urls[i]).then(d => d.json())).map(t => t.ip)
      )
    }

    dns = Array.from(new Set(list))

    fs.writeFileSync(dnsFilePath, JSON.stringify(dns, null, 2))
  }

  console.log(`DNS count ${dns.length}.`)
  return dns
}

async function getIPs (dns, host) {
  console.log(`Start resolve ${host} to IPs.`)
  let ips = []
  let ipsPromises = []
  let dnsResolvedCount = 0
  let dnsPushedCount = 0

  function outputPush () {
    dnsPushedCount++
    stdout.write(
      `Pushing...\t${dnsPushedCount}/${dns.length} ${(
        (dnsPushedCount / dns.length) *
        100
      ).toFixed(2)}% \r`
    )
  }

  function outputResolve () {
    dnsResolvedCount++
    stdout.write(
      `Resolving...\t${(dnsResolvedCount / 2).toFixed(0)}/${dns.length} ${(
        ((dnsResolvedCount * 2) / dns.length) *
        100
      ).toFixed(2)}% \r`
    )
  }

  //   console.log('Pushing...')
  for (let i = 0; i < dns.length; i++) {
    const resolver = new Resolver({ timeout: 3000, tries: 3 })
    resolver.setServers([dns[i]])
    outputPush()

    // force to ipv4
    ipsPromises.push(
      resolver
        .resolve4(host)
        .then(list => {
          if (list && list.length > 0) {
            ips = ips.concat(list)
          }
        })
        .catch(err => {})
        .finally(() => {
          outputResolve()
        })
    )

    // force to ipv6
    ipsPromises.push(
      resolver
        .resolve6(host)
        .then(list => {
          if (list && list.length > 0) {
            ips = ips.concat(list)
          }
        })
        .catch(err => {})
        .finally(() => {
          outputResolve()
        })
    )
  }

  console.log('\n✅ Push done.')
  await Promise.all(ipsPromises)
  console.log('\n✅ Resolve done.')

  ips = Array.from(new Set(ips)).sort((a, b) => a.localeCompare(b))

  console.log(`IP number ${ips.length}.`)
  console.log('Resolved IPs ' + JSON.stringify(ips, null, 2))
  return ips
}

async function curlTest (url, host, ips) {
  function output () {
    testCount++
    stdout.write(
      `Testing...\t${testCount}/${ips.length} ${(
        (testCount / ips.length) *
        100
      ).toFixed(2)}% \r`
    )
  }

  let curlPromises = []
  const start = Date.now()
  let testCount = 0
  let successCount = 0
  let successLogs = []
  for (let i = 0; i < ips.length; i++) {
    // try {
    //   const ip = ips[i];
    //   const res = await execSync(`curl -s ${url} -m 3 --resolve ${host}:443:${ip} --resolve ${host}:80:${ip}`)
    //   successCount++;
    //   if (String(res).length > 0) {
    //     successLogs.push(`${ip}\t\tis ok,\ttime: ${Date.now() - start}`)
    //   } else {
    //     successLogs.push(`${ip}\t\tis zero,\ttime: ${Date.now() - start}`)
    //   }
    //   output();
    // } catch (err) {
    //   output();
    // }
    curlPromises.push(
      (ip =>
        exec(
          `curl -s ${url} -m 10 --resolve ${host}:443:${ip} --resolve ${host}:80:${ip}`
        )
          .then(result => {
            successCount++
            if (String(result?.stdout).length > 0) {
              successLogs.push(`${ip}\t\tis ok,\ttime: ${Date.now() - start}`)
            } else {
              successLogs.push(`${ip}\t\tis zero,\ttime: ${Date.now() - start}`)
            }
          })
          .catch(err => {
            // console.log(`${ip} is error`)
          })
          .finally(() => {
            output()
          }))(ips[i])
    )
  }

  await Promise.all(curlPromises)

  console.log(`\n✅ Test done.\n`)
  console.log(successLogs.join('\n'))
  if (successCount > 0) {
    console.log(`\n🎉 Curl test done. You have ${successCount} IPs available.`)
  } else {
    console.log(`\n✅ Curl test done. None available.`)
  }
}

export default async args => {
  // URL & Host
  const url = args[0]
  const host = new URL(url).host

  const dns = await getDNSList(args)

  const ips = await getIPs(dns, host)

  await curlTest(url, host, ips)

  console.log('All done!')
}
