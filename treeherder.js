/* eslint-env es2022 */

let pushList = document.getElementById("push-list");
if (pushList) {
  handlePushList();
} else {
  let observer = new MutationObserver(function(mutations) {
    pushList = document.getElementById("push-list");
    if (pushList) {
      observer.disconnect();
      handlePushList();
    }
  });
  observer.observe(document.body, { subtree: true, childList: true });
}

function handlePushList() {
  for (let push of pushList.querySelectorAll("#push-list > .push")) {
    addPushlogButton(push);
  }

  let observer = new MutationObserver(function(mutations) {
    for (let mutation of mutations) {
      for (let node of mutation.addedNodes) {
        if (node.classList.contains("push")) {
          addPushlogButton(node);
        }
      }
    }
  });
  observer.observe(pushList, { childList: true });
}

function addPushlogButton(push) {
  let titleLeft = push.querySelector(".push-title-left");
  let link = titleLeft.querySelector("a");
  let url = new URL(link.href);
  let repo = url.searchParams.get("repo");
  let revision = url.searchParams.get("revision");

  let button = document.createElement("button");
  button.textContent = "Pushlog";
  button.addEventListener("click", async function() {
    button.disabled = true;

    try {
      let data = await getYAMLData(repo, revision);
      if (!data.has("comm_head_rev") || !data.has("comm_base_rev")) {
        return;
      }

      window.open(`${
        data.get("comm_head_repository")
      }/pushloghtml?fromchange=${
        data.get("comm_base_rev")
      }&tochange=${
        data.get("comm_head_rev")
      }`);

      let baseData = await getYAMLData(repo, data.get("comm_base_rev"));
      if (baseData.has("head_rev") && baseData.get("head_rev") != data.get("head_rev")) {
        window.open(`${
          data.get("head_repository")
        }/pushloghtml?fromchange=${
          baseData.get("head_rev")
        }&tochange=${
          data.get("head_rev")
        }`);
      }
    } finally {
      button.disabled = false;
    }
  });

  titleLeft.appendChild(document.createTextNode(" "));
  titleLeft.appendChild(button);
}

async function getYAMLData(repo, revision) {
  let request = await fetch(`https://firefox-ci-tc.services.mozilla.com/api/index/v1/task/comm.v2.${
    repo
  }.revision.${
    revision
  }.taskgraph.decision/artifacts/public/parameters.yml`, { mode: "cors", credentials: "omit" });
  let yaml = await request.text();
  let data = new Map();
  for (let line of yaml.split("\n")) {
    let [key, value] = line.split(": ", 2);
    data.set(key, value);
  }
  return data;  
}
