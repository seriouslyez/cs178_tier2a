function executeTransforms(values, transforms) {
    if (!transforms)
        return values;
    if (!Array.isArray(transforms))
        return transforms(values);
    return transforms.reduce((res, t) => t(res), values);
}

export { executeTransforms };
//# sourceMappingURL=executeTransforms.js.map
