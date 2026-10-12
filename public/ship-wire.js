import{appearance,MODELS,COLORS}from'./ship-catalog.js?v=72';
export function shipAppearance(input={}){const valid=(n,max)=>Number.isInteger(n)&&n>=0&&n<max?n:0;return{craft:valid(input?.craft,MODELS.length),color:valid(input?.color,COLORS.length),custom:appearance(input?.custom)};}
