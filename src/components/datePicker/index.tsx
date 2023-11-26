"use client"
import { useState, useEffect } from "react";
import "./index.css";

const weekArr: string[] = [
  "星期一",
  "星期二",
  "星期三",
  "星期四",
  "星期五",
  "星期六",
  "星期日",
];

const xHeader = new Array(24).fill(0).map((item, index) => index);
// 选项有7行 每行有48格
const dateOptions = new Array(168 * 2).fill(0).map((item, index) => {
  const row = Math.floor(index / 48);
  const col = Math.floor(index % 48);
  return {
    key: index,
    row,
    col,
    checked: false,
  };
});

type IDetailList = {
  [key: number]: number | number[];
};

type IChecedItem = {
  key: number;
  row: number;
  col: number;
  checked: boolean;
};

const DatePicker = () => {
  const [allItems, setAllItems] = useState(dateOptions);
  const [checkedDetail, setCheckedDetail] = useState({} as IDetailList);
  const [selectItemIds, setSelectItemIds] = useState([] as number[]);

  useEffect(() => {
    const parent = document.getElementById("data-cont")!;
    const mask = document.getElementById("mask")!;
    let selectList: number[] = [];
    // 遮罩层的四角位置
    let startTop = 0,
      endTop = 0,
      startLeft = 0,
      endLeft = 0;

    parent.onmousedown = function (e) {
      // 只有鼠标左键可以触发遮罩层
      if (e.button !== 0) return;
      parent.addEventListener("mousemove", getMousePosition);
      startTop = e.y - parent.offsetTop;
      startLeft = e.x - parent.offsetLeft;
    };

    // 鼠标移动超出 元素宽高，则重置 信息
    parent.addEventListener("mouseleave", resetPosition);

    // 鼠标抬起触发
    parent.onmouseup = function (e) {
      parent.removeEventListener("mousemove", getMousePosition);
      if (e.button !== 0) return;
      selectList.length && setSelectItemIds(selectList);
      resetPosition();
    };

    // 重置鼠标选中信息
    function resetPosition() {
      if (
        mask.style.width ||
        mask.style.height ||
        mask.style.top ||
        mask.style.left
      ) {
        mask.removeAttribute("style");
        startTop = 0;
        endTop = 0;
        startLeft = 0;
        endLeft = 0;
      }
      selectList = [];
    }

    // 鼠标移动触发
    function getMousePosition(e: MouseEvent) {
      // 获取大盒子下的所有可选中的子元素
      const childrenList = parent.querySelectorAll(".choice-item");
      // 获取遮罩层位置信息
      const maskPosition = mask.getBoundingClientRect();
      // 鼠标移动触发时，先清空数据
      selectList = [];

      // 拿到选中区域的子元素的索引
      for (let i = 0; i < childrenList.length; i++) {
        const { left, top, right, bottom } =
          childrenList[i].getBoundingClientRect();
        if (
          right > maskPosition.left &&
          bottom > maskPosition.top &&
          left < maskPosition.right &&
          top < maskPosition.bottom
        ) {
          selectList.push(i);
        }
      }
      // 获取移动中的鼠标位置
      // endTop = window.event.y - parent.getBoundingClientRect().top;
      // endLeft = window.event.x - parent.getBoundingClientRect().left;
      endTop = e.y - parent.offsetTop;
      endLeft = e.x - parent.offsetLeft;
      // 设置遮罩层的位置
      mask.style.top = Math.min(startTop, endTop) + "px";
      mask.style.left = Math.min(startLeft, endLeft) + "px";

      // 计算遮罩层宽高
      const maskWidth = Math.abs(startLeft - endLeft);
      const maskHeight = Math.abs(startTop - endTop);
      mask.style.width = maskWidth + "px";
      mask.style.height = maskHeight + "px";
    }

    return () => {
      parent.removeEventListener("mousemove", getMousePosition);
      parent.removeEventListener("mouseleave", resetPosition);
    };
  }, []);

  // 转换数据结构，为了计算连续时间区间
  const transferStruct = (arr: number[]) => {
    if (arr.length < 2) return arr;
    const newArr: (number | number[])[] = [];
    let pre = arr[0];
    let part = [pre];
    for (let i = 1; i < arr.length; i++) {
      const cur = arr[i];
      if (cur - pre === 1) {
        part.push(cur);
      } else {
        newArr.push(part.length === 1 ? part[0] : part);
        part = [cur];
      }
      pre = cur;
    }
    newArr.push(part.length === 1 ? part[0] : part);
    return newArr;
  };

  /**
   * 点击一个box之后，处理展示详情的数据结构，包括排序等
   * @param curItem
   */
  const getDetailInfo = (
    curItem: IChecedItem,
    curCheckedDetail: IDetailList
  ) => {
    const { checked, row, col } = curItem;
    const week = row;
    let list = JSON.parse(JSON.stringify(curCheckedDetail));
    let weekData: number[] = [];
    let len = 0;
    if (list[week]?.length) {
      weekData = list[week].flat();
      len = weekData.length;
    }
    let newWeekData: number[] = [];
    // 代表当前操作的是选中
    if (checked) {
      if (len) {
        // 顺序
        let preCol = Number.MIN_SAFE_INTEGER;
        let isAdd = false;
        weekData.forEach((item, index) => {
          if (col > preCol && col < item) {
            isAdd = true;
            newWeekData.push(curItem.col);
          }
          preCol = item;
          newWeekData.push(item);
          if (index === len - 1 && !isAdd) newWeekData.push(curItem.col);
        });
        list[week] = transferStruct(newWeekData);
      } else {
        list[week] = [curItem.col];
      }
    } else {
      newWeekData = weekData.filter((item) => item !== col);
      if (transferStruct(newWeekData).length) {
        list[week] = transferStruct(newWeekData);
      } else {
        delete list[week];
      }
    }
    return list;
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const isMove = selectItemIds.length > 0;
    if (isMove) {
      let curCheckedDetail = { ...checkedDetail };
      // 原选中的时间，再次选中会变成未选中状态
      const newAllItems = allItems.map((item) => {
        let newItem = item;
        let checked = item.checked;
        if (selectItemIds.includes(item.key)) {
          checked = !checked;
          newItem = {
            ...item,
            checked,
          };
          curCheckedDetail = getDetailInfo(newItem, curCheckedDetail);
        }
        return newItem;
      });
      setSelectItemIds([]);
      setAllItems(newAllItems);
      setCheckedDetail(curCheckedDetail);
    } else {
      const checkedItemId = (e.target as HTMLAnchorElement).id;
      const item = allItems.find((item) => String(item.key) === checkedItemId);
      const artKey = item!.key;
      const newAllItems = [...allItems];
      const { checked } = newAllItems[artKey];
      const newItem = {
        ...newAllItems[artKey],
        checked: !checked,
      };
      newAllItems[artKey] = newItem;
      setAllItems(newAllItems);
      setCheckedDetail(getDetailInfo(newItem, checkedDetail));
    }
  };

  const clearAll = () => {
    setAllItems(dateOptions);
    setCheckedDetail({});
  };

  const getTimeStr = (timeArr: number[]) => {
    const getTime = (col: number) => {
      const hour = String(Math.floor(col / 2)).padStart(2, "0");
      const minut = col % 2 === 0 ? "00" : "30";
      return `${hour}:${minut}`;
    };
    return timeArr
      .map((col) => {
        let start = "";
        let end = "";
        if (Array.isArray(col)) {
          start = getTime(col[0]);
          end = getTime(col[col.length - 1] + 1);
          return `${start}~${end}`;
        } else {
          start = getTime(col);
          end = getTime(col + 1);
          return `${start}~${end}`;
        }
      })
      .join("、");
  };

  return (
    <div className="data-picker-container">
      <div className="data-header">
        <span className="choice-item">
          <span className="choice-box checked"></span>
          <span>已选</span>
        </span>
        <span className="choice-item optional-item">
          <span className="choice-box"></span>
          <span>可选</span>
        </span>
      </div>
      <div className="data-content">
        <div className="data-xy-name">星期/时间</div>
        <div className="data-x">
          <div className="data-x-section">
            <div className="data-x-box">
              <span>00:00 - 12:00</span>
            </div>
            <div className="data-x-box">
              <span>12:00 - 24:00</span>
            </div>
          </div>
          <div className="data-x-time">
            {xHeader.map((item) => (
              <div className="data-x-box data-x-time-item" key={item}>
                <span>
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="data-y">
          <div className="data-y-name">
            <div>星期一</div>
            <div>星期二</div>
            <div>星期三</div>
            <div>星期四</div>
            <div>星期五</div>
            <div>星期六</div>
            <div>星期日</div>
          </div>
        </div>
        <div className="data-cont" id="data-cont" onClick={handleClick}>
          {allItems.map((item) => {
            const { key, checked, row, col } = item;
            return (
              <span
                id={key}
                key={`${key}_${row}_${col}`}
                className={`choice-item ${checked ? "checked" : ""}`}
              ></span>
            );
          })}
          <div id="mask" className="mask"></div>
        </div>
      </div>
      <div className="data-footer">
        {Object.keys(checkedDetail).length ? (
          <>
            <span className="clear-btn" onClick={clearAll}>
              清空
            </span>
            <div className="info-name">已选时间段</div>
            <div className="data-footer-detail">
              {Object.keys(checkedDetail).map((weekIndex: any) => {
                const week = weekArr[weekIndex];
                const time = getTimeStr(checkedDetail[weekIndex] as number[]);
                return (
                  <div key={`${week}_${time}`} className="day-info">
                    <span>{week}</span>
                    <span className="time-detail">{time}</span>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p>可拖动鼠标选择时间段</p>
        )}
      </div>
    </div>
  );
};

export default DatePicker;
